import dotenv from 'dotenv';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { createDnsRetryFetch } from './neonFetch';
import * as schema from './schema';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

neonConfig.fetchFunction = createDnsRetryFetch(fetch);

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });