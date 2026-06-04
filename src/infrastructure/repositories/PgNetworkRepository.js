import { eq } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { networks } from '@/infrastructure/db/schema';
import { Network } from '@/domain/network/Network';
export class PgNetworkRepository {
    async findById(id) {
        const rows = await db.select().from(networks).where(eq(networks.id, id)).limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async findByAccessPointId(accessPointId) {
        const rows = await db.select().from(networks).where(eq(networks.accessPointId, accessPointId));
        return rows.map(row => this.toDomain(row));
    }
    async findAll() {
        const rows = await db.select().from(networks);
        return rows.map(row => this.toDomain(row));
    }
    async save(network) {
        const record = {
            id: network.id,
            cidr: network.cidr,
            networkAddress: network.networkAddress,
            broadcastAddress: network.broadcastAddress,
            subnetMask: network.subnetMask,
            wildcardMask: network.wildcardMask,
            usableStart: network.usableStart,
            usableEnd: network.usableEnd,
            totalHosts: network.totalHosts,
            prefix: network.prefix,
            isPrivate: network.isPrivate,
            gateway: network.gateway,
            vlan: network.vlan,
            accessPointId: network.accessPointId,
        };
        await db
            .insert(networks)
            .values(record)
            .onConflictDoUpdate({ target: networks.id, set: record });
    }
    toDomain(row) {
        return new Network({
            id: row.id,
            cidr: row.cidr,
            gateway: row.gateway,
            vlan: row.vlan,
            accessPointId: row.accessPointId,
        });
    }
}
