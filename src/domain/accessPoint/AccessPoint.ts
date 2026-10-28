import { Entity } from '@/domain/common/Entity';
import { AccessPointStatus } from './AccessPointStatus';

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export class AccessPoint extends Entity<string> {
  name: string;
  readonly managementIpId: string;
  readonly baseId: string;
  sector: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  azimuth?: number;
  tilt?: number;
  beamwidth?: number;
  private _status: AccessPointStatus;

  constructor(params: {
    id: string;
    name: string;
    managementIpId: string;
    baseId: string;
    sector: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    azimuth?: number;
    tilt?: number;
    beamwidth?: number;
    status?: AccessPointStatus;
  }) {
    super(params.id);
    if (!params.name.trim()) throw new Error('AccessPoint name is required');
    if (!params.managementIpId) throw new Error('AccessPoint must reference a management IP');
    if (!params.baseId) throw new Error('AccessPoint must belong to a base');
    if (!params.sector.trim()) throw new Error('AccessPoint sector is required');
    if (params.latitude !== undefined && (!Number.isFinite(params.latitude) || params.latitude < -90 || params.latitude > 90)) {
      throw new Error('AccessPoint latitude must be between -90 and 90');
    }
    if (params.longitude !== undefined && (!Number.isFinite(params.longitude) || params.longitude < -180 || params.longitude > 180)) {
      throw new Error('AccessPoint longitude must be between -180 and 180');
    }

    this.name = params.name;
    this.managementIpId = params.managementIpId;
    this.baseId = params.baseId;
    this.sector = params.sector;
    this.latitude = params.latitude;
    this.longitude = params.longitude;
    this.altitude = params.altitude;
    this.azimuth = params.azimuth;
    this.tilt = params.tilt;
    this.beamwidth = params.beamwidth;
    this._status = params.status ?? 'online';
  }

  get coordinates(): Coordinates | undefined {
    if (this.latitude !== undefined && this.longitude !== undefined) {
      return {
        latitude: this.latitude,
        longitude: this.longitude,
        altitude: this.altitude,
      };
    }
    return undefined;
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