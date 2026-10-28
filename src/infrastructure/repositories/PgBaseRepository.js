import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { bases } from '@/infrastructure/db/schema';
import { Base } from '@/domain/base/Base';
export class PgBaseRepository {
    async findById(id) {
        const rows = await db.select().from(bases).where(and(eq(bases.id, id), isNull(bases.deletedAt))).limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async findAll() {
        const rows = await db.select().from(bases).where(isNull(bases.deletedAt)).orderBy(bases.name);
        return rows.map(row => this.toDomain(row));
    }
    async findByName(name) {
        const rows = await db.select().from(bases).where(and(eq(bases.name, name), isNull(bases.deletedAt))).limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async findByNameAndLocation(name, location) {
        const rows = await db
            .select()
            .from(bases)
            .where(sql `lower(trim(${bases.name})) = lower(trim(${name})) AND lower(trim(${bases.location})) = lower(trim(${location})) AND ${bases.deletedAt} IS NULL`)
            .limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async save(base) {
        const record = {
            id: base.id,
            name: base.name,
            location: base.location,
            latitude: base.latitude ?? null,
            longitude: base.longitude ?? null,
            altitude: base.altitude ?? null,
            status: base.status,
        };
        await db
            .insert(bases)
            .values(record)
            .onConflictDoUpdate({ target: bases.id, set: record });
    }
    async delete(id) {
        const existing = await this.findById(id);
        if (!existing)
            return null;
        await db.update(bases).set({ deletedAt: new Date() }).where(eq(bases.id, id));
        return existing;
    }
    toDomain(row) {
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
