export type AuditAction = 'create' | 'update' | 'delete' | 'assign' | 'release' | 'reserve';

export class AuditEvent {
  readonly id: string;
  readonly entity: string;
  readonly entityId: string;
  readonly action: AuditAction;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly performedBy: string;
  readonly createdAt: Date;

  constructor(params: {
    id: string;
    entity: string;
    entityId: string;
    action: AuditAction;
    payload?: Record<string, unknown>;
    performedBy: string;
    createdAt?: Date;
  }) {
    if (!params.id) throw new Error('AuditEvent id is required');
    if (!params.entity.trim()) throw new Error('AuditEvent entity is required');
    if (!params.entityId) throw new Error('AuditEvent entityId is required');
    if (!params.performedBy.trim()) throw new Error('AuditEvent performedBy is required');

    this.id = params.id;
    this.entity = params.entity;
    this.entityId = params.entityId;
    this.action = params.action;
    this.payload = Object.freeze(params.payload ?? {});
    this.performedBy = params.performedBy;
    this.createdAt = params.createdAt ?? new Date();
  }
}