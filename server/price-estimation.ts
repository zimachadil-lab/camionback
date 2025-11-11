import OpenAI from "openai";
import type { TransportRequest } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

interface PriceEstimation {
  totalClientMAD: number;
  transporterFeeMAD: number;
  platformFeeMAD: number;
  confidence: number;
  reasoning: string[];
  modeledInputs: {
    estimatedWeight?: string;
    estimatedVolume?: string;
    handlingRequired?: string;
    goodsType?: string;
  };
}

interface EstimationCache {
  signature: string;
  result: PriceEstimation;
  timestamp: number;
}

// In-memory cache for price estimations (12 hour TTL)
const estimationCache = new Map<string, EstimationCache>();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// Generate cache key from request properties
function generateCacheKey(request: TransportRequest): string {
  const normalizedDesc = (request.description || '').toLowerCase().trim();
  return `${request.fromCity}|${request.toCity}|${request.distance}|${request.goodsType}|${normalizedDesc}`;
}

// Clean expired cache entries
function cleanExpiredCache() {
  const now = Date.now();
  const entries = Array.from(estimationCache.entries());
  for (const [key, entry] of entries) {
    if (now - entry.timestamp > CACHE_TTL) {
      estimationCache.delete(key);
    }
  }
}

// Helper: Calculate CamionBack 60/40 split with 200 MAD minimum platform fee
function computeCamionBackSplit(totalClientMAD: number): {
  totalClientMAD: number;
  transporterFeeMAD: number;
  platformFeeMAD: number;
} {
  // Enforce minimum 500 MAD total to guarantee 60/40 split with 200 MAD minimum platform fee
  // Calculation: if 40% must be ≥200 MAD, then total must be ≥500 MAD (200/0.4 = 500)
  const adjustedTotal = Math.max(totalClientMAD, 500);
  
  const platformFeeMAD = Math.round(adjustedTotal * 0.4); // Always 40%
  const transporterFeeMAD = adjustedTotal - platformFeeMAD; // Always 60%
  
  if (adjustedTotal > totalClientMAD) {
    console.log(`[CamionBack Split] Total price increased from ${totalClientMAD} to ${adjustedTotal} MAD to maintain 60/40 split with 200 MAD minimum platform fee`);
  }
  
  return { totalClientMAD: adjustedTotal, transporterFeeMAD, platformFeeMAD };
}

// Heuristic fallback estimation with CamionBack discount (-40%)
function getHeuristicEstimate(distance: number | null, category: string): PriceEstimation {
  const baseFare = 700; // MAD
  const distanceMultiplier = 3.5; // MAD per km
  const handlingFee = 400; // MAD
  
  const distanceKm = distance || 100; // Default 100km if no distance
  const distanceCost = distanceKm * distanceMultiplier;
  
  // Adjust based on category
  let categoryMultiplier = 1.0;
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('déménagement') || lowerCategory.includes('demenagement')) {
    categoryMultiplier = 1.3;
  } else if (lowerCategory.includes('fragile')) {
    categoryMultiplier = 1.2;
  } else if (lowerCategory.includes('vrac') || lowerCategory.includes('construction')) {
    categoryMultiplier = 0.9;
  }
  
  const traditionalPrice = (baseFare + distanceCost + handlingFee) * categoryMultiplier;
  // CamionBack advantage: -40% using empty returns
  const camionbackPrice = Math.round(traditionalPrice * 0.6);
  
  const split = computeCamionBackSplit(camionbackPrice);
  
  return {
    totalClientMAD: split.totalClientMAD,
    transporterFeeMAD: split.transporterFeeMAD,
    platformFeeMAD: split.platformFeeMAD,
    confidence: 0.3,
    reasoning: [
      "Estimation heuristique (IA temporairement indisponible)",
      `Prix traditionnel : ${Math.round(traditionalPrice)} MAD`,
      `Réduction CamionBack (retours à vide) : -40% → ${split.totalClientMAD} MAD`,
      `Répartition garantie 60/40 : Transporteur ${split.transporterFeeMAD} MAD (60%), Plateforme ${split.platformFeeMAD} MAD (40%)`
    ],
    modeledInputs: {
      goodsType: category,
      handlingRequired: "Standard"
    }
  };
}

// Main price estimation function
export async function estimatePriceForRequest(request: TransportRequest): Promise<PriceEstimation> {
  // Clean expired cache periodically
  if (Math.random() < 0.1) { // 10% chance to clean
    cleanExpiredCache();
  }
  
  // Check cache first
  const cacheKey = generateCacheKey(request);
  const cached = estimationCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log(`[Price Estimation] Cache hit for request ${request.id}`);
    return cached.result;
  }
  
  try {
    console.log(`[Price Estimation] Calling GPT-5 for request ${request.id}`);
    
    // Build intelligent prompt with CamionBack concept
    const prompt = `Tu es un expert en tarification logistique au Maroc avec 15 ans d'expérience, spécialisé dans la plateforme CamionBack.

CONCEPT CAMIONBACK - IMPORTANT :
CamionBack utilise les RETOURS À VIDE des transporteurs, ce qui réduit les coûts de -40% par rapport aux prix traditionnels.
Pour les PETITS VOLUMES, nous proposons le GROUPAGE avec d'autres clients, réduisant encore plus les coûts.

MISSION : Estimer le coût de transport pour cette demande en tenant compte du concept CamionBack.

INFORMATIONS DISPONIBLES :
- Description du client : "${request.description || 'Non spécifié'}"
- Catégorie de marchandise : ${request.goodsType || 'Non catégorisée'}
- Distance : ${request.distance ? `${request.distance} km` : 'Distance non calculée (estimer ~100-200 km)'}
- Trajet : ${request.fromCity} → ${request.toCity}
${request.photos && request.photos.length > 0 ? `- Photos fournies : ${request.photos.length} image(s)` : ''}

MÉTHODE DE CALCUL :
1. Calcule d'abord le prix TRADITIONNEL avec cette formule :
   Prix traditionnel = Forfait base (500-1000 MAD) + (Distance × 2-5 MAD/km) + (Volume × 50-150 MAD/m³) + (Poids × 0.5-2 MAD/kg) + Manutention (200-800 MAD)

2. Applique la réduction CamionBack :
   - Retours à vide : -40%
   - Si petit volume (< 5m³) : Mentionne l'avantage du groupage (prix encore plus avantageux)
   
3. Prix final CamionBack = Prix traditionnel × 0.6 (minimum 300 MAD)

CONSIGNES :
1. Analyse la description pour ESTIMER le poids et volume
2. Identifie si manutention spéciale est requise
3. Calcule le prix traditionnel puis applique -40% pour CamionBack
4. Mentionne EXPLICITEMENT dans ton raisonnement : retours à vide ET groupage (si applicable)
5. Prix minimum : 300 MAD, maximum raisonnable : 9000 MAD

RÉPONSE REQUISE (JSON strict) :
{
  "traditional_price_mad": <nombre: prix marché traditionnel>,
  "camionback_price_mad": <nombre: prix final CamionBack après -40%>,
  "confidence": <0.0 à 1.0>,
  "reasoning": [
    "DOIT mentionner 'retours à vide' ou 'empty returns'",
    "DOIT mentionner 'groupage' si petit volume",
    "Estimation poids/volume",
    "Calcul détaillé du prix traditionnel",
    "Application réduction CamionBack -40%"
  ],
  "modeled_inputs": {
    "estimated_weight": "ex: 500 kg",
    "estimated_volume": "ex: 2.5 m³",
    "handling_required": "Standard/Spéciale/Aucune",
    "goods_type": "ex: Meubles, Électronique, etc."
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Tu es expert tarification logistique Maroc. Réponds UNIQUEMENT en JSON valide selon le format demandé."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192  // GPT-5 uses reasoning tokens internally, need higher limit
      // Note: GPT-5 only supports default temperature (1.0), custom values not allowed
    });
    
    console.log('[Price Estimation] GPT-5 Response:', JSON.stringify({
      choices: response.choices?.length || 0,
      hasContent: !!response.choices?.[0]?.message?.content,
      fullResponse: response
    }));
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('[Price Estimation] No content in response:', response);
      throw new Error("No response from AI");
    }
    
    // Parse AI response
    const aiResult = JSON.parse(content);
    
    // Extract CamionBack price and confidence
    let camionbackPrice = Math.round(aiResult.camionback_price_mad || 0);
    const confidence = Math.max(0, Math.min(1, aiResult.confidence || 0.5));
    
    // Clamp price to reasonable range
    camionbackPrice = Math.min(9000, camionbackPrice);
    
    // Apply 60/40 split with 200 MAD minimum platform fee (also enforces 500 MAD minimum total)
    const split = computeCamionBackSplit(camionbackPrice);
    
    const result: PriceEstimation = {
      totalClientMAD: split.totalClientMAD,
      transporterFeeMAD: split.transporterFeeMAD,
      platformFeeMAD: split.platformFeeMAD,
      confidence,
      reasoning: Array.isArray(aiResult.reasoning) ? aiResult.reasoning : ["Estimation basée sur l'analyse IA CamionBack"],
      modeledInputs: aiResult.modeled_inputs || {}
    };
    
    // Validate against heuristic (reject if too far off)
    const heuristic = getHeuristicEstimate(request.distance, request.goodsType || '');
    const deviation = Math.abs(camionbackPrice - heuristic.totalClientMAD) / heuristic.totalClientMAD;
    
    if (deviation > 0.6 && confidence < 0.65) {
      // AI deviates too much from heuristic with low confidence - use heuristic
      console.log(`[Price Estimation] AI deviated ${Math.round(deviation * 100)}% from heuristic, using heuristic fallback`);
      return heuristic;
    }
    
    // Cache the result
    estimationCache.set(cacheKey, {
      signature: cacheKey,
      result,
      timestamp: Date.now()
    });
    
    console.log(`[Price Estimation] Success: ${result.totalClientMAD} MAD total (Transporteur: ${result.transporterFeeMAD} MAD 60%, Plateforme: ${result.platformFeeMAD} MAD 40%, confidence: ${confidence})`);
    return result;
    
  } catch (error) {
    console.error('[Price Estimation] AI call failed:', error);
    
    // Fallback to heuristic
    const heuristic = getHeuristicEstimate(request.distance, request.goodsType || '');
    
    // Don't cache fallback results
    return heuristic;
  }
}
