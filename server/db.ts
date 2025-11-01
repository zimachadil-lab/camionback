import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from '../shared/schema';
import ws from 'ws';

// Configure WebSocket for Neon in Node.js environment
neonConfig.webSocketConstructor = ws;

// Determine the correct database URL based on environment
function getDatabaseUrl(): string {
  // In production deployment, use production database credentials
  if (process.env.REPLIT_DEPLOYMENT === 'true' || process.env.NODE_ENV === 'production') {
    // Check if we have production-specific credentials
    if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
      const prodUrl = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE}?sslmode=require`;
      console.log('🔄 [DATABASE] Using PRODUCTION database connection');
      return prodUrl;
    }
  }
  
  // Default to DATABASE_URL (development)
  console.log('🔄 [DATABASE] Using DEVELOPMENT database connection');
  return process.env.DATABASE_URL!;
}

const connectionString = getDatabaseUrl();

// Create a connection pool with proper timeout configuration for production
const pool = new Pool({ 
  connectionString,
  connectionTimeoutMillis: 10000, // 10 seconds to establish connection
  idleTimeoutMillis: 30000, // 30 seconds idle before closing
  max: 10, // maximum pool size
});

// Handle pool errors to prevent crashes
pool.on('error', (err) => {
  console.error('❌ [DATABASE] Unexpected pool error:', err);
});

// Create the drizzle instance
export const db = drizzle(pool, { schema });
