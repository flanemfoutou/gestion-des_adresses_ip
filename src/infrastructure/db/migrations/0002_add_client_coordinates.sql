ALTER TABLE IF EXISTS "clients" ADD COLUMN IF NOT EXISTS "latitude" numeric(10, 7);
ALTER TABLE IF EXISTS "clients" ADD COLUMN IF NOT EXISTS "longitude" numeric(10, 7);
ALTER TABLE IF EXISTS "clients" ADD COLUMN IF NOT EXISTS "altitude" numeric(7, 2);
