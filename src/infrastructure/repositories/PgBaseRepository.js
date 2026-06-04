import { eq } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { bases } from '@/infrastructure/db/schema';
import { Base } from '@/domain/base/Base';
export class PgBaseRepository {
    async findById(id) {
        const rows = await db.select().from(bases).where(eq(bases.id, id)).limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async findAll() {
        const rows = await db.select().from(bases).orderBy(bases.name);
        return rows.map(row => this.toDomain(row));
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
