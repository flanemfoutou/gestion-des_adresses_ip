import { desc, eq } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { ipAssignments } from '@/infrastructure/db/schema';
import { IpAssignment } from '@/domain/ipAssignment/IpAssignment';
export class PgIpAssignmentRepository {
    async findById(id) {
        const rows = await db.select().from(ipAssignments).where(eq(ipAssignments.id, id)).limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async findActiveByClientId(clientId) {
        const rows = await db
            .select()
            .from(ipAssignments)
            .where(and(eq(ipAssignments.clientId, clientId), eq(ipAssignments.status, 'assigned')))
            .limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async findActiveByIpAddressId(ipAddressId) {
        const rows = await db
            .select()
            .from(ipAssignments)
            .where(and(eq(ipAssignments.ipAddressId, ipAddressId), eq(ipAssignments.status, 'assigned')))
            .limit(1);
        if (!rows[0])
            return null;
        return this.toDomain(rows[0]);
    }
    async listHistoryByIp(ipAddressId) {
        const rows = await db
            .select()
            .from(ipAssignments)
            .where(eq(ipAssignments.ipAddressId, ipAddressId))
            .orderBy(desc(ipAssignments.assignedAt));
        return rows.map(row => this.toDomain(row));
    }
    async save(assignment) {
        const record = {
            id: assignment.id,
            ipAddressId: assignment.ipAddressId,
            clientId: assignment.clientId,
            status: assignment.status,
            assignedAt: assignment.assignedAt,
            releasedAt: assignment.releasedAt,
        };
        await db
            .insert(ipAssignments)
            .values(record)
            .onConflictDoUpdate({ target: ipAssignments.id, set: record });
    }
    toDomain(row) {
        return new IpAssignment({
            id: row.id,
            ipAddressId: row.ipAddressId,
            clientId: row.clientId,
            status: row.status,
            assignedAt: row.assignedAt,
            releasedAt: row.releasedAt,
        });
    }
}
