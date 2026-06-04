import { eq } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { bases } from '@/infrastructure/db/schema';
import { Base } from '@/domain/base/Base';
import { BaseRepository } from '@/application/ports/repositories';

export class PgBaseRepository implements BaseRepository {
  async findById(id: string): Promise<Base | null> {
    const rows = await db.select().from(bases).where(eq(bases.id, id)).limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findAll(): Promise<Base[]> {
    const rows = await db.select().from(bases).orderBy(bases.name);
    return rows.map(row => this.toDomain(row));
  }

  async save(base: Base): Promise<void> {
    const record = {
      id: base.id,
      name: base.name,
      location: base.location,
      status: base.status,
    };

    await db
      .insert(bases)
      .values(record)
      .onConflictDoUpdate({ target: bases.id, set: record });
  }

  private toDomain(row: typeof bases.$inferSelect): Base {
    return new Base({
      id: row.id,
      name: row.name,
      location: row.location,
      status: row.status,
    });
  }
}
