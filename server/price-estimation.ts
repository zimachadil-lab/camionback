import OpenAI from "openai";
import type { TransportRequest } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

interface PriceEstimation {
  priceMinMAD: number;
  priceMaxMAD: number;
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

// Heuristic fallback estimation
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
  
  const basePrice = (baseFare + distanceCost + handlingFee) * categoryMultiplier;
  const margin = basePrice * 0.25; // ±25% margin
  
  return {
    priceMinMAD: Math.round(basePrice - margin),
    priceMaxMAD: Math.round(basePrice + margin),
    confidence: 0.3,
    reasoning: [
      "Estimation heuristique (IA temporairement indisponible)",
      `Forfait de base : ${baseFare} MAD`,
      `Distance : ${distanceKm} km × ${distanceMultiplier} MAD/km = ${Math.round(distanceCost)} MAD`,
      `Manutention estimée : ${handlingFee} MAD`,
      `Ajustement catégorie : ${Math.round((categoryMultiplier - 1) * 100)}%`
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
    
    // Build intelligent prompt
    const prompt = `Tu es un expert en tarification logistique au Maroc avec 15 ans d'expérience.

MISSION : Estimer le coût de transport en Dirham marocain (MAD) pour cette demande.

INFORMATIONS DISPONIBLES :
- Description du client : "${request.description || 'Non spécifié'}"
- Catégorie de marchandise : ${request.goodsType || 'Non catégorisée'}
- Distance : ${request.distance ? `${request.distance} km` : 'Distance non calculée (estimer ~100-200 km)'}
- Trajet : ${request.fromCity} → ${request.toCity}
${request.photos && request.photos.length > 0 ? `- Photos fournies : ${request.photos.length} image(s)` : ''}

FORMULE DE TARIFICATION MAROC :
Prix = Forfait base (500-1000 MAD) + (Distance × 2-5 MAD/km) + (Volume × 50-150 MAD/m³) + (Poids × 0.5-2 MAD/kg) + Manutention (200-800 MAD)

CONSIGNES :
1. Analyse la description pour ESTIMER le poids et volume (même sans info exacte)
2. Identifie si manutention spéciale est requise (fragile, lourd, encombrant)
3. Calcule une fourchette réaliste (prix_min et prix_max) avec ±30-40% de marge
4. Prix minimum : 300 MAD, maximum raisonnable : 15000 MAD (sauf très longue distance)
5. Sois transparent sur tes hypothèses

RÉPONSE REQUISE (JSON strict) :
{
  "price_min_mad": <nombre>,
  "price_max_mad": <nombre>,
  "confidence": <0.0 à 1.0>,
  "reasoning": [
    "Hypothèse 1 (ex: Volume estimé à 3m³ d'après 'cartons')",
    "Hypothèse 2",
    "Calcul détaillé"
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
      max_completion_tokens: 2000,
      temperature: 0.7
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }
    
    // Parse AI response
    const aiResult = JSON.parse(content);
    
    // Validate and normalize response
    let priceMin = Math.round(aiResult.price_min_mad || 0);
    let priceMax = Math.round(aiResult.price_max_mad || 0);
    const confidence = Math.max(0, Math.min(1, aiResult.confidence || 0.5));
    
    // Clamp prices to reasonable ranges
    priceMin = Math.max(300, Math.min(20000, priceMin));
    priceMax = Math.max(300, Math.min(20000, priceMax));
    
    // Ensure max >= min
    if (priceMax < priceMin) {
      [priceMin, priceMax] = [priceMax, priceMin];
    }
    
    // Ensure some minimum spread
    if (priceMax - priceMin < 100) {
      const avg = (priceMin + priceMax) / 2;
      priceMin = Math.round(avg * 0.85);
      priceMax = Math.round(avg * 1.15);
    }
    
    const result: PriceEstimation = {
      priceMinMAD: priceMin,
      priceMaxMAD: priceMax,
      confidence,
      reasoning: Array.isArray(aiResult.reasoning) ? aiResult.reasoning : ["Estimation basée sur l'analyse IA"],
      modeledInputs: aiResult.modeled_inputs || {}
    };
    
    // Validate against heuristic (reject if too far off)
    const heuristic = getHeuristicEstimate(request.distance, request.goodsType || '');
    const heuristicAvg = (heuristic.priceMinMAD + heuristic.priceMaxMAD) / 2;
    const aiAvg = (priceMin + priceMax) / 2;
    const deviation = Math.abs(aiAvg - heuristicAvg) / heuristicAvg;
    
    if (deviation > 0.5 && confidence < 0.7) {
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
    
    console.log(`[Price Estimation] Success: ${priceMin}-${priceMax} MAD (confidence: ${confidence})`);
    return result;
    
  } catch (error) {
    console.error('[Price Estimation] AI call failed:', error);
    
    // Fallback to heuristic
    const heuristic = getHeuristicEstimate(request.distance, request.goodsType || '');
    
    // Don't cache fallback results
    return heuristic;
  }
}
