import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { networks } from '@/infrastructure/db/schema';
import { Network } from '@/domain/network/Network';
import { NetworkRepository } from '@/application/ports/repositories';

export class PgNetworkRepository implements NetworkRepository {
  async findById(id: string): Promise<Network | null> {
    const rows = await db.select().from(networks).where(and(eq(networks.id, id), isNull(networks.deletedAt))).limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findByCidr(cidr: string): Promise<Network | null> {
    const rows = await db.select().from(networks).where(and(eq(networks.cidr, cidr), isNull(networks.deletedAt))).limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findByAccessPointId(accessPointId: string): Promise<Network[]> {
    const rows = await db.select().from(networks).where(and(eq(networks.accessPointId, accessPointId), isNull(networks.deletedAt)));
    return rows.map(row => this.toDomain(row));
  }

  async findAll(): Promise<Network[]> {
    const rows = await db.select().from(networks).where(isNull(networks.deletedAt));
    return rows.map(row => this.toDomain(row));
  }

  async save(network: Network): Promise<void> {
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

  async delete(id: string): Promise<Network | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    await db.update(networks).set({ deletedAt: new Date() }).where(eq(networks.id, id));
    return existing;
  }

  private toDomain(row: typeof networks.$inferSelect): Network {
    return new Network({
      id: row.id,
      cidr: row.cidr,
      gateway: row.gateway,
      vlan: row.vlan,
      accessPointId: row.accessPointId,
    });
  }
}