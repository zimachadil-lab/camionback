import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from '../shared/schema';
import ws from 'ws';

// Configure WebSocket for Neon in Node.js environment
neonConfig.webSocketConstructor = ws;

// Create a connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create the drizzle instance
export const db = drizzle(pool, { schema });
