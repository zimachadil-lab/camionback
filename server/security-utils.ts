import type { Response } from "express";
import type { User } from "@shared/schema";

/**
 * Type pour utilisateur sanitizé (sans données sensibles)
 */
export type SanitizedUser = Omit<User, 'passwordHash'> & {
  phoneNumber: string; // Peut être masqué ou complet selon contexte
};

/**
 * Type pour payloads contenant des utilisateurs
 */
export type PayloadWithUsers<T = any> = T & {
  user?: User | null;
  users?: User[];
  client?: User | null;
  transporter?: User | null;
  [key: string]: any;
};

/**
 * Masque un numéro de téléphone pour affichage public
 * Exemple: +212664373534 → +2126•••••534
 */
export function maskPhoneNumber(phoneNumber: string | null): string {
  if (!phoneNumber) return '';
  
  const cleaned = phoneNumber.replace(/\s/g, '');
  
  if (cleaned.length < 8) {
    return phoneNumber;
  }
  
  const start = cleaned.slice(0, 5);
  const end = cleaned.slice(-3);
  const masked = `${start}•••••${end}`;
  
  return masked;
}

/**
 * Retire les champs sensibles d'un objet utilisateur
 * TOUJOURS utiliser cette fonction avant de retourner un user dans une API
 */
export function sanitizeUser(user: User | undefined | null, context: 'admin' | 'owner' | 'public' = 'public'): SanitizedUser | null {
  if (!user) return null;
  
  const { passwordHash, ...userWithoutPassword } = user;
  
  // Admin et Owner voient le numéro complet
  if (context === 'admin' || context === 'owner') {
    return userWithoutPassword;
  }
  
  // Public : masquer le numéro de téléphone
  return {
    ...userWithoutPassword,
    phoneNumber: maskPhoneNumber(user.phoneNumber)
  };
}

/**
 * Sanitize une liste d'utilisateurs
 */
export function sanitizeUsers(users: User[], context: 'admin' | 'owner' | 'public' = 'public'): SanitizedUser[] {
  return users.map(user => sanitizeUser(user, context)).filter((u): u is SanitizedUser => u !== null);
}

/**
 * Vérifie si un utilisateur a le rôle requis
 */
export function hasRole(user: User | null | undefined, allowedRoles: string[]): boolean {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Vérifie si un utilisateur est admin
 */
export function isAdmin(user: User | null | undefined): boolean {
  return hasRole(user, ['admin']);
}

/**
 * Vérifie si un utilisateur est admin ou coordinateur
 */
export function isAdminOrCoordinator(user: User | null | undefined): boolean {
  return hasRole(user, ['admin', 'coordinateur']);
}

/**
 * Sanitize un payload complexe contenant des utilisateurs
 * Détecte et sanitize automatiquement tous les champs user/users
 */
export function sanitizePayload<T extends PayloadWithUsers>(
  payload: T,
  context: 'admin' | 'owner' | 'public' = 'public'
): any {
  if (!payload || typeof payload !== 'object') return payload;
  
  const sanitized: any = { ...payload };
  
  // Sanitize user fields connus
  if ('user' in sanitized && sanitized.user) {
    sanitized.user = sanitizeUser(sanitized.user as User, context);
  }
  
  if ('users' in sanitized && Array.isArray(sanitized.users)) {
    sanitized.users = sanitizeUsers(sanitized.users as User[], context);
  }
  
  if ('client' in sanitized && sanitized.client) {
    sanitized.client = sanitizeUser(sanitized.client as User, context);
  }
  
  if ('transporter' in sanitized && sanitized.transporter) {
    sanitized.transporter = sanitizeUser(sanitized.transporter as User, context);
  }
  
  // Sanitize arrays d'objets contenant des users
  for (const key in sanitized) {
    if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) => {
        if (item && typeof item === 'object' && ('user' in item || 'client' in item || 'transporter' in item)) {
          return sanitizePayload(item, context);
        }
        return item;
      });
    }
  }
  
  return sanitized;
}

/**
 * Helper Express pour envoyer un utilisateur sanitizé
 * Usage: return sendUser(res, user, 'admin');
 */
export function sendUser(
  res: Response,
  user: User | null | undefined,
  context: 'admin' | 'owner' | 'public' = 'owner'
): Response {
  return res.json({ user: sanitizeUser(user, context) });
}

/**
 * Helper Express pour envoyer une liste d'utilisateurs sanitizés
 * Usage: return sendUsers(res, users, 'admin');
 */
export function sendUsers(
  res: Response,
  users: User[],
  context: 'admin' | 'owner' | 'public' = 'admin'
): Response {
  return res.json(sanitizeUsers(users, context));
}

/**
 * Helper Express pour envoyer un payload contenant des utilisateurs
 * Usage: return sendPayload(res, { request, client, offers }, 'admin');
 */
export function sendPayload<T extends PayloadWithUsers>(
  res: Response,
  payload: T,
  context: 'admin' | 'owner' | 'public' = 'public'
): Response {
  return res.json(sanitizePayload(payload, context));
}
