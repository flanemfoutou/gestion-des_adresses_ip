import { eq, ilike, or } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { clients } from '@/infrastructure/db/schema';
import { Client } from '@/domain/client/Client';
export class PgClientRepository {
    async findById(id) {
        const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async findByAccessPointId(accessPointId) {
        const rows = await db.select().from(clients).where(eq(clients.accessPointId, accessPointId));
        return rows.map(row => this.toDomain(row));
    }
    async search(query, limit = 20, offset = 0) {
        const rows = await db
            .select()
            .from(clients)
            .where(or(ilike(clients.fullName, `%${query}%`), ilike(clients.phoneNumber, `%${query}%`)))
            .limit(limit)
            .offset(offset);
        return rows.map(row => this.toDomain(row));
    }
    async save(client) {
        const record = {
            id: client.id,
            fullName: client.fullName,
            phoneNumber: client.phoneNumber,
            clientType: client.clientType,
            accessPointId: client.accessPointId,
            ipAddressId: client.ipAddressId,
        };
        await db
            .insert(clients)
            .values(record)
            .onConflictDoUpdate({ target: clients.id, set: record });
    }
    toDomain(row) {
        return new Client({
            id: row.id,
            fullName: row.fullName,
            phoneNumber: row.phoneNumber,
            clientType: row.clientType,
            accessPointId: row.accessPointId,
            ipAddressId: row.ipAddressId,
        });
    }
}
