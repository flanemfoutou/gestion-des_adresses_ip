import { Entity } from '@/domain/common/Entity';
import { AccessPointStatus } from './AccessPointStatus';

export class AccessPoint extends Entity<string> {
  readonly name: string;
  readonly managementIpId: string;
  readonly baseId: string;
  readonly sector: string;
  private _status: AccessPointStatus;

  constructor(params: {
    id: string;
    name: string;
    managementIpId: string;
    baseId: string;
    sector: string;
    status?: AccessPointStatus;
  }) {
    super(params.id);
    if (!params.name.trim()) throw new Error('AccessPoint name is required');
    if (!params.managementIpId) throw new Error('AccessPoint must reference a management IP');
    if (!params.baseId) throw new Error('AccessPoint must belong to a base');
    if (!params.sector.trim()) throw new Error('AccessPoint sector is required');

    this.name = params.name;
    this.managementIpId = params.managementIpId;
    this.baseId = params.baseId;
    this.sector = params.sector;
    this._status = params.status ?? 'online';
  }

  get status(): AccessPointStatus {
    return this._status;
  }

  goOnline(): void {
    if (this._status === 'online') throw new Error('AccessPoint is already online');
    this._status = 'online';
  }

  goOffline(): void {
    if (this._status === 'offline') throw new Error('AccessPoint is already offline');
    this._status = 'offline';
  }

  setMaintenance(): void {
    if (this._status === 'maintenance') throw new Error('AccessPoint is already in maintenance');
    this._status = 'maintenance';
  }
}