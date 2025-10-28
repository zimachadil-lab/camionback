import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from '../shared/schema';
import ws from 'ws';

// Configure WebSocket for Neon in Node.js environment
neonConfig.webSocketConstructor = ws;

// Create a connection pool with proper timeout configuration for production
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
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
