import { desc, eq } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { cpeDevices } from '@/infrastructure/db/schema';
import { CpeDevice, Coordinates } from '@/domain/cpeDevice/CpeDevice';
import { CpeDeviceRepository } from '@/application/ports/repositories';

export class PgCpeDeviceRepository implements CpeDeviceRepository {
  async findById(id: string): Promise<CpeDevice | null> {
    const rows = await db.select().from(cpeDevices).where(eq(cpeDevices.id, id)).limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findByClientId(clientId: string): Promise<CpeDevice[]> {
    const rows = await db.select().from(cpeDevices).where(eq(cpeDevices.clientId, clientId));
    return rows.map(row => this.toDomain(row));
  }

  async findByAccessPointId(accessPointId: string): Promise<CpeDevice[]> {
    const rows = await db.select().from(cpeDevices).where(eq(cpeDevices.accessPointId, accessPointId));
    return rows.map(row => this.toDomain(row));
  }

  async findAll(): Promise<CpeDevice[]> {
    const rows = await db.select().from(cpeDevices).orderBy(desc(cpeDevices.createdAt));
    return rows.map(row => this.toDomain(row));
  }

  async save(cpeDevice: CpeDevice): Promise<void> {
    const record = {
      id: cpeDevice.id,
      clientId: cpeDevice.clientId,
      accessPointId: cpeDevice.accessPointId,
      model: cpeDevice.model,
      macAddress: cpeDevice.macAddress,
      latitude: cpeDevice.coordinates?.latitude != null ? cpeDevice.coordinates.latitude.toString() : null,
      longitude: cpeDevice.coordinates?.longitude != null ? cpeDevice.coordinates.longitude.toString() : null,
      altitude: cpeDevice.coordinates?.altitude != null ? cpeDevice.coordinates.altitude.toString() : null,
      azimuth: cpeDevice.azimuth != null ? cpeDevice.azimuth.toString() : null,
      createdAt: cpeDevice.createdAt,
      updatedAt: cpeDevice.updatedAt,
    };

    await db
      .insert(cpeDevices)
      .values(record)
      .onConflictDoUpdate({ target: cpeDevices.id, set: record });
  }

  private toDomain(row: typeof cpeDevices.$inferSelect): CpeDevice {
    const coordinates: Coordinates | undefined =
      row.latitude !== null && row.longitude !== null
        ? { latitude: Number(row.latitude), longitude: Number(row.longitude), altitude: row.altitude !== null ? Number(row.altitude) : undefined }
        : undefined;

    return new CpeDevice({
      id: row.id,
      clientId: row.clientId,
      accessPointId: row.accessPointId,
      model: row.model,
      macAddress: row.macAddress,
      coordinates,
      azimuth: row.azimuth !== null ? Number(row.azimuth) : undefined,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
    });
  }
}
