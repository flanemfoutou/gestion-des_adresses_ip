import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { ipAddresses } from '@/infrastructure/db/schema';
import { IpAddress } from '@/domain/ipAddress/IpAddress';
export class PgIpAddressRepository {
    async findById(id) {
        const rows = await db.select().from(ipAddresses).where(eq(ipAddresses.id, id)).limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async findByAddress(address) {
        const rows = await db.select().from(ipAddresses).where(eq(ipAddresses.address, address)).limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async findAvailableByNetwork(networkId, limit = 50, offset = 0) {
        const rows = await db
            .select()
            .from(ipAddresses)
            .where(and(eq(ipAddresses.networkId, networkId), eq(ipAddresses.status, 'free'), eq(ipAddresses.reserved, false), eq(ipAddresses.active, true)))
            .limit(limit)
            .offset(offset)
            .orderBy(asc(ipAddresses.address));
        return rows.map(row => this.toDomain(row));
    }
    async findByStatus(status, limit = 50, offset = 0) {
        const rows = await db
            .select()
            .from(ipAddresses)
            .where(eq(ipAddresses.status, status))
            .limit(limit)
            .offset(offset)
            .orderBy(asc(ipAddresses.address));
        return rows.map(row => this.toDomain(row));
    }
    async findByNetworkId(networkId, limit = 50, offset = 0) {
        const rows = await db
            .select()
            .from(ipAddresses)
            .where(eq(ipAddresses.networkId, networkId))
            .limit(limit)
            .offset(offset)
            .orderBy(asc(ipAddresses.address));
        return rows.map(row => this.toDomain(row));
    }
    async countAvailableByNetwork(networkId) {
        const rows = await db
            .select({ count: sql `count(*)` })
            .from(ipAddresses)
            .where(and(eq(ipAddresses.networkId, networkId), eq(ipAddresses.status, 'free'), eq(ipAddresses.reserved, false), eq(ipAddresses.active, true)));
        return Number(rows[0]?.count ?? 0);
    }
    async countByStatus(status) {
        const rows = await db
            .select({ count: sql `count(*)` })
            .from(ipAddresses)
            .where(eq(ipAddresses.status, status));
        return Number(rows[0]?.count ?? 0);
    }
    async countByNetworkId(networkId) {
        const rows = await db
            .select({ count: sql `count(*)` })
            .from(ipAddresses)
            .where(eq(ipAddresses.networkId, networkId));
        return Number(rows[0]?.count ?? 0);
    }
    async save(ipAddress) {
        const record = {
            id: ipAddress.id,
            address: ipAddress.address,
            status: ipAddress.status,
            usageType: ipAddress.usageType,
            reserved: ipAddress.reserved,
            active: ipAddress.active,
            networkId: ipAddress.networkId,
        };
        await db
            .insert(ipAddresses)
            .values(record)
            .onConflictDoUpdate({ target: ipAddresses.id, set: record });
    }
    toDomain(row) {
        return new IpAddress({
            id: row.id,
            address: row.address,
            status: row.status,
            usageType: row.usageType,
            reserved: row.reserved,
            active: row.active,
            networkId: row.networkId,
        });
    }
}
