import { Entity } from '@/domain/common/Entity';
import { IpAssignmentStatus } from './IpAssignmentStatus';

export class IpAssignment extends Entity<string> {
  readonly ipAddressId: string;
  readonly clientId: string | null;
  readonly accessPointId: string;
  readonly assignedAt: Date;
  private _status: IpAssignmentStatus;
  private _releasedAt: Date | null;

  constructor(params: {
    id: string;
    ipAddressId: string;
    clientId?: string | null;
    accessPointId: string;
    status?: IpAssignmentStatus;
    assignedAt?: Date;
    releasedAt?: Date | null;
  }) {
    super(params.id);
    if (!params.ipAddressId) throw new Error('IpAssignment must reference an IP address');
    if (!params.accessPointId) throw new Error('IpAssignment must reference an access point');
    if (params.status === 'assigned' && !params.clientId) throw new Error('Assigned IpAssignment must reference a client');

    this.ipAddressId = params.ipAddressId;
    this.clientId = params.clientId ?? null;
    this.accessPointId = params.accessPointId;
    this._status = params.status ?? 'assigned';
    this.assignedAt = params.assignedAt ?? new Date();
    this._releasedAt = params.releasedAt ?? null;
  }

  get status(): IpAssignmentStatus {
    return this._status;
  }

  get releasedAt(): Date | null {
    return this._releasedAt;
  }

  release(): void {
    if (this._status !== 'assigned') throw new Error('Only assigned IPs can be released');
    this._status = 'released';
    this._releasedAt = new Date();
  }

  markFailed(): void {
    if (this._status !== 'assigned') throw new Error('Only assigned IPs can be marked as failed');
    this._status = 'failed';
    this._releasedAt = new Date();
  }
}