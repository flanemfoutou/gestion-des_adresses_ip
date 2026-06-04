import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { ipAddresses } from '@/infrastructure/db/schema';
import { IpAddress } from '@/domain/ipAddress/IpAddress';
import { IpAddressStatus } from '@/domain/ipAddress/IpAddressEnums';
import { IpAddressRepository } from '@/application/ports/repositories';

export class PgIpAddressRepository implements IpAddressRepository {
  async findById(id: string): Promise<IpAddress | null> {
    const rows = await db.select().from(ipAddresses).where(eq(ipAddresses.id, id)).limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findByAddress(address: string): Promise<IpAddress | null> {
    const rows = await db.select().from(ipAddresses).where(eq(ipAddresses.address, address)).limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findAvailableByNetwork(networkId: string, limit = 50, offset = 0): Promise<IpAddress[]> {
    const rows = await db
      .select()
      .from(ipAddresses)
      .where(
        and(
          eq(ipAddresses.networkId, networkId),
          eq(ipAddresses.status, 'free'),
          eq(ipAddresses.reserved, false),
          eq(ipAddresses.active, true),
        ),
      )
      .limit(limit)
      .offset(offset)
      .orderBy(asc(ipAddresses.address));
    return rows.map(row => this.toDomain(row));
  }

  async findByStatus(
    status: IpAddressStatus,
    limit = 50,
    offset = 0,
  ): Promise<IpAddress[]> {
    const rows = await db
      .select()
      .from(ipAddresses)
      .where(eq(ipAddresses.status, status))
      .limit(limit)
      .offset(offset)
      .orderBy(asc(ipAddresses.address));
    return rows.map(row => this.toDomain(row));
  }

  async findByNetworkId(
    networkId: string,
    limit = 50,
    offset = 0,
  ): Promise<IpAddress[]> {
    const rows = await db
      .select()
      .from(ipAddresses)
      .where(eq(ipAddresses.networkId, networkId))
      .limit(limit)
      .offset(offset)
      .orderBy(asc(ipAddresses.address));
    return rows.map(row => this.toDomain(row));
  }

  async countAvailableByNetwork(networkId: string): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(ipAddresses)
      .where(
        and(
          eq(ipAddresses.networkId, networkId),
          eq(ipAddresses.status, 'free'),
          eq(ipAddresses.reserved, false),
          eq(ipAddresses.active, true),
        ),
      );
    return Number(rows[0]?.count ?? 0);
  }

  async countByStatus(status: IpAddressStatus): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(ipAddresses)
      .where(eq(ipAddresses.status, status));
    return Number(rows[0]?.count ?? 0);
  }

  async countByNetworkId(networkId: string): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(ipAddresses)
      .where(eq(ipAddresses.networkId, networkId));
    return Number(rows[0]?.count ?? 0);
  }

  async save(ipAddress: IpAddress): Promise<void> {
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

  private toDomain(row: typeof ipAddresses.$inferSelect): IpAddress {
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