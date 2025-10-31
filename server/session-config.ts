import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { db } from './db';
import { neon } from '@neondatabase/serverless';

const PgSession = connectPgSimple(session);

// Get database connection from DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required for sessions');
}

// Create a SQL connection for the session store
const sql = neon(databaseUrl);

// Session secret - MUST be configured
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is required');
}

/**
 * Configuration express-session sécurisée
 * - Cookies HttpOnly (protection XSS)
 * - Cookies Secure en production (HTTPS only)
 * - Store PostgreSQL pour persistence
 * - Expiration 7 jours (pas de logout forcé)
 */
export const sessionConfig: session.SessionOptions = {
  store: new PgSession({
    conObject: {
      connectionString: databaseUrl,
    },
    tableName: 'session', // Table name pour stocker les sessions
    createTableIfMissing: true, // Créer automatiquement la table si elle n'existe pas
  }),
  secret: sessionSecret,
  resave: false, // Ne pas sauvegarder si non modifié
  saveUninitialized: false, // Ne pas créer de session vide
  rolling: true, // Reset expiration à chaque requête
  cookie: {
    httpOnly: true, // Protection XSS - le cookie n'est PAS accessible via JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only en production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // none en prod pour compatibilité cross-site
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours - pas de logout forcé
  },
  name: 'camionback.sid', // Nom personnalisé pour éviter détection automatique
};

/**
 * Types TypeScript pour les sessions
 * Extend Express.Session avec nos propriétés custom
 */
declare module 'express-session' {
  interface SessionData {
    userId: string;
    role?: string;
    phoneNumber?: string;
  }
}
