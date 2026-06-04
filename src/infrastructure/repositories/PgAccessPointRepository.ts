import { eq } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { accessPoints } from '@/infrastructure/db/schema';
import { AccessPoint } from '@/domain/accessPoint/AccessPoint';
import { AccessPointRepository } from '@/application/ports/repositories';

export class PgAccessPointRepository implements AccessPointRepository {
  async findById(id: string): Promise<AccessPoint | null> {
    const rows = await db.select().from(accessPoints).where(eq(accessPoints.id, id)).limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findByManagementIpId(managementIpId: string): Promise<AccessPoint | null> {
    const rows = await db
      .select()
      .from(accessPoints)
      .where(eq(accessPoints.managementIpId, managementIpId))
      .limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findByBaseId(baseId: string): Promise<AccessPoint[]> {
    const rows = await db.select().from(accessPoints).where(eq(accessPoints.baseId, baseId));
    return rows.map(row => this.toDomain(row));
  }

  async save(accessPoint: AccessPoint): Promise<void> {
    const record = {
      id: accessPoint.id,
      name: accessPoint.name,
      managementIpId: accessPoint.managementIpId,
      baseId: accessPoint.baseId,
      sector: accessPoint.sector,
      latitude: (accessPoint as any).latitude ?? null,
      longitude: (accessPoint as any).longitude ?? null,
      altitude: (accessPoint as any).altitude ?? null,
      azimuth: (accessPoint as any).azimuth ?? null,
      tilt: (accessPoint as any).tilt ?? null,
      beamwidth: (accessPoint as any).beamwidth ?? null,
      status: accessPoint.status,
    };

    await db
      .insert(accessPoints)
      .values(record)
      .onConflictDoUpdate({ target: accessPoints.id, set: record });
  }

  private toDomain(row: typeof accessPoints.$inferSelect): AccessPoint {
    return new AccessPoint({
      id: row.id,
      name: row.name,
      managementIpId: row.managementIpId,
      baseId: row.baseId,
      sector: row.sector,
      status: row.status,
      latitude: row.latitude !== null ? Number(row.latitude) : undefined,
      longitude: row.longitude !== null ? Number(row.longitude) : undefined,
      altitude: row.altitude !== null ? Number(row.altitude) : undefined,
      azimuth: row.azimuth !== null ? Number(row.azimuth) : undefined,
      tilt: row.tilt !== null ? Number(row.tilt) : undefined,
      beamwidth: row.beamwidth !== null ? Number(row.beamwidth) : undefined,
    });
  }
}