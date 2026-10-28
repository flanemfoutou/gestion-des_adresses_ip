import { desc, eq } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { cpeDevices } from '@/infrastructure/db/schema';
import { CpeDevice } from '@/domain/cpeDevice/CpeDevice';
export class PgCpeDeviceRepository {
    async findById(id) {
        const rows = await db.select().from(cpeDevices).where(eq(cpeDevices.id, id)).limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async findByClientId(clientId) {
        const rows = await db.select().from(cpeDevices).where(eq(cpeDevices.clientId, clientId));
        return rows.map(row => this.toDomain(row));
    }
    async findByAccessPointId(accessPointId) {
        const rows = await db.select().from(cpeDevices).where(eq(cpeDevices.accessPointId, accessPointId));
        return rows.map(row => this.toDomain(row));
    }
    async findAll() {
        const rows = await db.select().from(cpeDevices).orderBy(desc(cpeDevices.createdAt));
        return rows.map(row => this.toDomain(row));
    }
    async save(cpeDevice) {
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
    toDomain(row) {
        const coordinates = row.latitude !== null && row.longitude !== null
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
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        });
    }
}
