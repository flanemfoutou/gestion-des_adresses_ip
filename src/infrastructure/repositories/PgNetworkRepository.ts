import { eq } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { networks } from '@/infrastructure/db/schema';
import { Network } from '@/domain/network/Network';
import { NetworkRepository } from '@/application/ports/repositories';

export class PgNetworkRepository implements NetworkRepository {
  async findById(id: string): Promise<Network | null> {
    const rows = await db.select().from(networks).where(eq(networks.id, id)).limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findByAccessPointId(accessPointId: string): Promise<Network[]> {
    const rows = await db.select().from(networks).where(eq(networks.accessPointId, accessPointId));
    return rows.map(row => this.toDomain(row));
  }

  async save(network: Network): Promise<void> {
    const record = {
      id: network.id,
      cidr: network.cidr,
      gateway: network.gateway,
      vlan: network.vlan,
      accessPointId: network.accessPointId,
    };

    await db
      .insert(networks)
      .values(record)
      .onConflictDoUpdate({ target: networks.id, set: record });
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