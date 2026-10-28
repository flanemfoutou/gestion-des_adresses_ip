import { and, eq, ilike, isNull, or } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { clients } from '@/infrastructure/db/schema';
import { Client } from '@/domain/client/Client';
export class PgClientRepository {
    async findById(id) {
        const rows = await db.select().from(clients).where(and(eq(clients.id, id), isNull(clients.deletedAt))).limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async findAll() {
        const rows = await db.select().from(clients).where(isNull(clients.deletedAt));
        return rows.map(row => this.toDomain(row));
    }
    async findByAccessPointId(accessPointId) {
        const rows = await db.select().from(clients).where(and(eq(clients.accessPointId, accessPointId), isNull(clients.deletedAt)));
        return rows.map(row => this.toDomain(row));
    }
    async findByIpAddressId(ipAddressId) {
        const rows = await db.select().from(clients).where(and(eq(clients.ipAddressId, ipAddressId), isNull(clients.deletedAt))).limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async findByPhoneNumber(phone) {
        const rows = await db.select().from(clients).where(and(eq(clients.phoneNumber, phone), isNull(clients.deletedAt))).limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async search(query, limit = 20, offset = 0) {
        const rows = await db
            .select()
            .from(clients)
            .where(or(and(isNull(clients.deletedAt), or(ilike(clients.fullName, `%${query}%`), ilike(clients.phoneNumber, `%${query}%`)))))
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
            latitude: client.coordinates?.latitude ?? null,
            longitude: client.coordinates?.longitude ?? null,
            altitude: client.coordinates?.altitude ?? null,
        };
        await db
            .insert(clients)
            .values(record)
            .onConflictDoUpdate({ target: clients.id, set: record });
    }
    async delete(id) {
        const existing = await this.findById(id);
        if (!existing)
            return null;
        await db.update(clients).set({ deletedAt: new Date() }).where(eq(clients.id, id));
        return existing;
    }
    toDomain(row) {
        return new Client({
            id: row.id,
            fullName: row.fullName,
            phoneNumber: row.phoneNumber,
            clientType: row.clientType,
            accessPointId: row.accessPointId,
            ipAddressId: row.ipAddressId,
            coordinates: row.latitude !== null && row.longitude !== null
                ? {
                    latitude: Number(row.latitude),
                    longitude: Number(row.longitude),
                    altitude: row.altitude !== null ? Number(row.altitude) : undefined,
                }
                : undefined,
        });
    }
}
