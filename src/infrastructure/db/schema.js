import { pgEnum, pgTable, varchar, uuid, text, integer, timestamp, boolean, uniqueIndex, index, numeric } from 'drizzle-orm/pg-core';
// ── Enums ──────────────────────────────────────────────────────────────────────
export const accessPointStatusEnum = pgEnum('access_point_status', ['online', 'offline', 'maintenance']);
export const baseStatusEnum = pgEnum('base_status', ['active', 'inactive', 'maintenance']);
export const ipAddressStatusEnum = pgEnum('ip_address_status', ['free', 'occupied', 'reserved', 'decommissioned']);
export const ipUsageTypeEnum = pgEnum('ip_usage_type', ['client', 'management', 'infrastructure']);
export const ipAssignmentStatusEnum = pgEnum('ip_assignment_status', ['assigned', 'released', 'failed']);
export const clientTypeEnum = pgEnum('client_type', ['residential', 'business', 'enterprise', 'iot']);
export const auditActionEnum = pgEnum('audit_action', ['create', 'update', 'delete', 'assign', 'release', 'reserve']);
export const signalQualityEnum = pgEnum('signal_quality', ['excellent', 'good', 'fair', 'poor', 'critical']);
// ── Tables ─────────────────────────────────────────────────────────────────────
export const bases = pgTable('bases', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 128 }).notNull(),
    location: varchar('location', { length: 128 }).notNull(),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    altitude: numeric('altitude', { precision: 7, scale: 2 }),
    status: baseStatusEnum('status').notNull().default('active'),
    deletedAt: timestamp('deleted_at', { mode: 'date' }).default(null),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});
export const accessPoints = pgTable('access_points', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 128 }).notNull(),
    managementIpId: uuid('management_ip_id').notNull(),
    baseId: uuid('base_id').notNull(),
    sector: varchar('sector', { length: 64 }).notNull(),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    altitude: numeric('altitude', { precision: 7, scale: 2 }),
    azimuth: numeric('azimuth', { precision: 5, scale: 2 }),
    tilt: numeric('tilt', { precision: 5, scale: 2 }),
    beamwidth: numeric('beamwidth', { precision: 5, scale: 2 }),
    status: accessPointStatusEnum('status').notNull().default('online'),
    deletedAt: timestamp('deleted_at', { mode: 'date' }).default(null),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, table => ({
    managementIpUnique: uniqueIndex('access_points_management_ip_id_unique').on(table.managementIpId),
    baseIdx: index('access_points_base_id_index').on(table.baseId),
}));
export const networks = pgTable('networks', {
    id: uuid('id').primaryKey().defaultRandom(),
    cidr: varchar('cidr', { length: 32 }).notNull(),
    networkAddress: varchar('network_address', { length: 64 }).notNull(),
    broadcastAddress: varchar('broadcast_address', { length: 64 }).notNull(),
    subnetMask: varchar('subnet_mask', { length: 64 }).notNull(),
    wildcardMask: varchar('wildcard_mask', { length: 64 }).notNull(),
    usableStart: varchar('usable_start', { length: 64 }).notNull(),
    usableEnd: varchar('usable_end', { length: 64 }).notNull(),
    totalHosts: integer('total_hosts').notNull(),
    prefix: integer('prefix').notNull(),
    isPrivate: boolean('is_private').notNull(),
    gateway: varchar('gateway', { length: 64 }).notNull(),
    vlan: integer('vlan').notNull(),
    accessPointId: uuid('access_point_id').notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }).default(null),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, table => ({
    accessPointIdx: index('networks_access_point_id_index').on(table.accessPointId),
    cidrUnique: uniqueIndex('networks_cidr_unique').on(table.cidr),
}));
export const cpeDevices = pgTable('cpe_devices', {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull(),
    accessPointId: uuid('access_point_id').notNull(),
    model: varchar('model', { length: 128 }).notNull(),
    macAddress: varchar('mac_address', { length: 32 }).notNull(),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    altitude: numeric('altitude', { precision: 7, scale: 2 }),
    azimuth: numeric('azimuth', { precision: 5, scale: 2 }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, table => ({
    clientIdx: index('cpe_devices_client_id_index').on(table.clientId),
    accessPointIdx: index('cpe_devices_access_point_id_index').on(table.accessPointId),
    macUnique: uniqueIndex('cpe_devices_mac_address_unique').on(table.macAddress),
}));
export const signalMetrics = pgTable('signal_metrics', {
    id: uuid('id').primaryKey().defaultRandom(),
    cpeId: uuid('cpe_id').notNull(),
    accessPointId: uuid('access_point_id').notNull(),
    rssi: numeric('rssi', { precision: 6, scale: 2 }).notNull(),
    snr: numeric('snr', { precision: 6, scale: 2 }),
    txPower: numeric('tx_power', { precision: 6, scale: 2 }),
    rxPower: numeric('rx_power', { precision: 6, scale: 2 }),
    linkQuality: numeric('link_quality', { precision: 5, scale: 2 }),
    quality: signalQualityEnum('quality').notNull(),
    distance: numeric('distance', { precision: 10, scale: 2 }),
    measuredAt: timestamp('measured_at', { mode: 'date' }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
}, table => ({
    cpeIdx: index('signal_metrics_cpe_id_index').on(table.cpeId),
    apIdx: index('signal_metrics_ap_id_index').on(table.accessPointId),
    measuredAtIdx: index('signal_metrics_measured_at_index').on(table.measuredAt),
}));
export const ipAddresses = pgTable('ip_addresses', {
    id: uuid('id').primaryKey().defaultRandom(),
    address: varchar('address', { length: 64 }).notNull(),
    status: ipAddressStatusEnum('status').notNull().default('free'),
    usageType: ipUsageTypeEnum('usage_type').notNull().default('client'),
    reserved: boolean('reserved').notNull().default(false),
    active: boolean('active').notNull().default(true),
    networkId: uuid('network_id').notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }).default(null),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, table => ({
    ipUnique: uniqueIndex('ip_addresses_address_unique').on(table.address),
    networkIdx: index('ip_addresses_network_id_index').on(table.networkId),
}));
export const clients = pgTable('clients', {
    id: uuid('id').primaryKey().defaultRandom(),
    fullName: varchar('full_name', { length: 128 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 32 }).notNull(),
    clientType: clientTypeEnum('client_type').notNull().default('residential'),
    accessPointId: uuid('access_point_id').notNull(),
    ipAddressId: uuid('ip_address_id').notNull(),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    altitude: numeric('altitude', { precision: 7, scale: 2 }),
    deletedAt: timestamp('deleted_at', { mode: 'date' }).default(null),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, table => ({
    accessPointIdx: index('clients_access_point_id_index').on(table.accessPointId),
}));
export const ipAssignments = pgTable('ip_assignments', {
    id: uuid('id').primaryKey().defaultRandom(),
    ipAddressId: uuid('ip_address_id').notNull(),
    clientId: uuid('client_id'),
    accessPointId: uuid('access_point_id').notNull(),
    status: ipAssignmentStatusEnum('status').notNull().default('assigned'),
    assignedAt: timestamp('assigned_at', { mode: 'date' }).notNull().defaultNow(),
    releasedAt: timestamp('released_at', { mode: 'date' }).default(null),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, table => ({
    ipIdx: index('ip_assignments_ip_address_id_index').on(table.ipAddressId),
    clientIdx: index('ip_assignments_client_id_index').on(table.clientId),
}));
export const auditEvents = pgTable('audit_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    entity: varchar('entity', { length: 64 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    action: auditActionEnum('action').notNull(),
    payload: text('payload').notNull(),
    performedBy: varchar('performed_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});
