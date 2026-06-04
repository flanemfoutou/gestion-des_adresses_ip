import { desc, eq } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { signalMetrics } from '@/infrastructure/db/schema';
import { SignalMetric } from '@/domain/signal/SignalMetric';
import { SignalMetricRepository } from '@/application/ports/repositories';

export class PgSignalMetricRepository implements SignalMetricRepository {
  async findById(id: string): Promise<SignalMetric | null> {
    const rows = await db.select().from(signalMetrics).where(eq(signalMetrics.id, id)).limit(1);
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findByCpeId(cpeId: string, limit = 20, offset = 0): Promise<SignalMetric[]> {
    const rows = await db
      .select()
      .from(signalMetrics)
      .where(eq(signalMetrics.cpeId, cpeId))
      .orderBy(desc(signalMetrics.measuredAt))
      .limit(limit)
      .offset(offset);

    return rows.map(row => this.toDomain(row));
  }

  async findLatestByCpeId(cpeId: string): Promise<SignalMetric | null> {
    const rows = await db
      .select()
      .from(signalMetrics)
      .where(eq(signalMetrics.cpeId, cpeId))
      .orderBy(desc(signalMetrics.measuredAt))
      .limit(1);

    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async save(signalMetric: SignalMetric): Promise<void> {
    const record = {
      id: signalMetric.id,
      cpeId: signalMetric.cpeId,
      accessPointId: signalMetric.accessPointId,
      rssi: signalMetric.rssi.toString(),
      snr: signalMetric.snr != null ? signalMetric.snr.toString() : null,
      txPower: signalMetric.txPower != null ? signalMetric.txPower.toString() : null,
      rxPower: signalMetric.rxPower != null ? signalMetric.rxPower.toString() : null,
      linkQuality: signalMetric.linkQuality != null ? signalMetric.linkQuality.toString() : null,
      quality: signalMetric.quality,
      distance: signalMetric.distance != null ? signalMetric.distance.toString() : null,
      measuredAt: signalMetric.measuredAt,
      createdAt: signalMetric.createdAt,
    };

    await db
      .insert(signalMetrics)
      .values(record)
      .onConflictDoUpdate({ target: signalMetrics.id, set: record });
  }

  private toDomain(row: typeof signalMetrics.$inferSelect): SignalMetric {
    return new SignalMetric({
      id: row.id,
      cpeId: row.cpeId,
      accessPointId: row.accessPointId,
      rssi: Number(row.rssi),
      snr: row.snr !== null ? Number(row.snr) : undefined,
      txPower: row.txPower !== null ? Number(row.txPower) : undefined,
      rxPower: row.rxPower !== null ? Number(row.rxPower) : undefined,
      linkQuality: row.linkQuality !== null ? Number(row.linkQuality) : undefined,
      quality: row.quality,
      distance: row.distance !== null ? Number(row.distance) : undefined,
      measuredAt: new Date(row.measuredAt),
      createdAt: new Date(row.createdAt),
    });
  }
}
