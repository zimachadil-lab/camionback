import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

/**
 * Récupère l'utilisateur actuel depuis la session
 * Retourne null si pas de session ou utilisateur introuvable
 */
export async function getCurrentUser(req: Request): Promise<User | null> {
  const userId = req.session?.userId;
  if (!userId) return null;
  
  try {
    const user = await storage.getUser(userId);
    return user || null;
  } catch (error) {
    console.error('[Auth] Erreur récupération utilisateur:', error);
    return null;
  }
}

/**
 * Middleware requireAuth - Vérifie que l'utilisateur est authentifié
 * Usage: app.get('/api/protected', requireAuth, (req, res) => ...)
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.session?.userId;
  
  if (!userId) {
    res.status(401).json({ 
      error: "Non authentifié",
      message: "Vous devez être connecté pour accéder à cette ressource" 
    });
    return;
  }
  
  // Vérifier que l'utilisateur existe toujours
  const user = await getCurrentUser(req);
  if (!user) {
    // User was deleted or session is stale
    req.session.destroy((err) => {
      if (err) console.error('[Auth] Erreur destruction session:', err);
    });
    res.status(401).json({ 
      error: "Session invalide",
      message: "Votre session a expiré ou est invalide" 
    });
    return;
  }
  
  // Check if account is blocked
  if (user.accountStatus === 'blocked') {
    res.status(403).json({ 
      error: "Compte bloqué",
      message: "Votre compte est temporairement désactivé. Merci de contacter le support CamionBack." 
    });
    return;
  }
  
  // Attach user to request for easy access in route handlers
  (req as any).user = user;
  
  next();
}

/**
 * Middleware requireRole - Vérifie que l'utilisateur a un des rôles requis
 * Usage: app.get('/api/admin/...', requireAuth, requireRole(['admin']), ...)
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user as User | undefined;
    
    // Si pas d'user attaché, c'est que requireAuth n'a pas été appelé
    if (!user) {
      res.status(500).json({ 
        error: "Configuration incorrecte",
        message: "requireAuth doit être appelé avant requireRole" 
      });
      return;
    }
    
    if (!user.role || !allowedRoles.includes(user.role)) {
      res.status(403).json({ 
        error: "Accès refusé",
        message: `Cette ressource nécessite un des rôles suivants: ${allowedRoles.join(', ')}` 
      });
      return;
    }
    
    next();
  };
}

/**
 * Middleware optionalAuth - Attache l'utilisateur si authentifié, sinon continue
 * Usage: Pour les endpoints qui peuvent fonctionner avec ou sans auth
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = await getCurrentUser(req);
  if (user) {
    (req as any).user = user;
  }
  next();
}

/**
 * Extension TypeScript pour req.user
 */
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
