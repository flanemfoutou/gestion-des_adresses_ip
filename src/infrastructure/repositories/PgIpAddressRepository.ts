import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/neon";
import { ipAddresses } from "@/infrastructure/db/schema";
import { IpAddress } from "@/domain/ipAddress/IpAddress";
import { IpAddressStatus } from "@/domain/ipAddress/IpAddressEnums";
import {
  IpAddressRepository,
  NetworkIpStats,
} from "@/application/ports/repositories";

export class PgIpAddressRepository implements IpAddressRepository {
  async findById(id: string): Promise<IpAddress | null> {
    const rows = await db
      .select()
      .from(ipAddresses)
      .where(eq(ipAddresses.id, id))
      .limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findByAddress(address: string): Promise<IpAddress | null> {
    const rows = await db
      .select()
      .from(ipAddresses)
      .where(eq(ipAddresses.address, address))
      .limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findAvailableByNetwork(
    networkId: string,
    limit = 50,
    offset = 0,
  ): Promise<IpAddress[]> {
    const rows = await db
      .select()
      .from(ipAddresses)
      .where(
        and(
          eq(ipAddresses.networkId, networkId),
          eq(ipAddresses.status, "free"),
          eq(ipAddresses.reserved, false),
          eq(ipAddresses.active, true),
        ),
      )
      .limit(limit)
      .offset(offset)
      .orderBy(asc(ipAddresses.address));
    return rows.map((row) => this.toDomain(row));
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
    return rows.map((row) => this.toDomain(row));
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
    return rows.map((row) => this.toDomain(row));
  }

  async countAvailableByNetwork(networkId: string): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(ipAddresses)
      .where(
        and(
          eq(ipAddresses.networkId, networkId),
          eq(ipAddresses.status, "free"),
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

  async getNetworkStats(networkId: string): Promise<{
    total: number;
    free: number;
    occupied: number;
    reserved: number;
    decommissioned: number;
  }> {
    const rows = await db
      .select({ status: ipAddresses.status, count: sql<number>`count(*)` })
      .from(ipAddresses)
      .where(eq(ipAddresses.networkId, networkId))
      .groupBy(ipAddresses.status);

    let total = 0;
    let free = 0;
    let occupied = 0;
    let reserved = 0;
    let decommissioned = 0;

    for (const row of rows) {
      const c = Number(row.count);
      total += c;
      if (row.status === "free") free = c;
      else if (row.status === "occupied") occupied = c;
      else if (row.status === "reserved") reserved = c;
      else if (row.status === "decommissioned") decommissioned = c;
    }

    return { total, free, occupied, reserved, decommissioned };
  }

  async getStatsByNetwork(): Promise<NetworkIpStats[]> {
    const rows = await db
      .select({
        networkId: ipAddresses.networkId,
        status: ipAddresses.status,
        count: sql<number>`count(*)`,
      })
      .from(ipAddresses)
      .groupBy(ipAddresses.networkId, ipAddresses.status);

    const statsByNetwork = new Map<string, NetworkIpStats>();

    for (const row of rows) {
      const stats = statsByNetwork.get(row.networkId) ?? {
        networkId: row.networkId,
        total: 0,
        free: 0,
        occupied: 0,
        reserved: 0,
      };
      const count = Number(row.count);

      stats.total += count;
      if (row.status === "free") stats.free = count;
      else if (row.status === "occupied") stats.occupied = count;
      else if (row.status === "reserved") stats.reserved = count;

      statsByNetwork.set(row.networkId, stats);
    }

    return [...statsByNetwork.values()];
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
