-- Migration: add unique index to ensure (lower(trim(name)), lower(trim(location))) is unique when not soft-deleted
-- This prevents creating two bases with the same name AND the same location, while allowing same name in different locations.

CREATE UNIQUE INDEX IF NOT EXISTS ux_bases_name_location ON bases (
  lower(trim(name)),
  lower(trim(location))
) WHERE deleted_at IS NULL;
