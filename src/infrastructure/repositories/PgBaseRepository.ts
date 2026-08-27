import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { bases } from '@/infrastructure/db/schema';
import { Base } from '@/domain/base/Base';
import { BaseRepository } from '@/application/ports/repositories';

export class PgBaseRepository implements BaseRepository {
  async findById(id: string): Promise<Base | null> {
    const rows = await db.select().from(bases).where(and(eq(bases.id, id), isNull(bases.deletedAt))).limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findAll(): Promise<Base[]> {
    const rows = await db.select().from(bases).where(isNull(bases.deletedAt)).orderBy(bases.name);
    return rows.map(row => this.toDomain(row));
  }

  async findByName(name: string): Promise<Base | null> {
    const rows = await db.select().from(bases).where(and(eq(bases.name, name), isNull(bases.deletedAt))).limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findByNameAndLocation(name: string, location: string): Promise<Base | null> {
    const rows = await db
      .select()
      .from(bases)
      .where(
        sql`lower(trim(${bases.name})) = lower(trim(${name})) AND lower(trim(${bases.location})) = lower(trim(${location})) AND ${bases.deletedAt} IS NULL`,
      )
      .limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async save(base: Base): Promise<void> {
    const record = {
      id: base.id,
      name: base.name,
      location: base.location,
      latitude: (base as any).latitude ?? null,
      longitude: (base as any).longitude ?? null,
      altitude: (base as any).altitude ?? null,
      status: base.status,
    };

    await db
      .insert(bases)
      .values(record)
      .onConflictDoUpdate({ target: bases.id, set: record });
  }

  async delete(id: string): Promise<Base | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    await db.update(bases).set({ deletedAt: new Date() }).where(eq(bases.id, id));
    return existing;
  }

  private toDomain(row: typeof bases.$inferSelect): Base {
    return new Base({
      id: row.id,
      name: row.name,
      location: row.location,
      latitude: row.latitude !== null ? Number(row.latitude) : undefined,
      longitude: row.longitude !== null ? Number(row.longitude) : undefined,
      altitude: row.altitude !== null ? Number(row.altitude) : undefined,
      status: row.status,
    });
  }
}
