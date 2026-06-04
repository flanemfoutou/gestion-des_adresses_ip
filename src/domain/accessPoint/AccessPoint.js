import { Entity } from '@/domain/common/Entity';
export class AccessPoint extends Entity {
    name;
    managementIpId;
    baseId;
    sector;
    latitude;
    longitude;
    altitude;
    azimuth;
    tilt;
    beamwidth;
    _status;
    constructor(params) {
        super(params.id);
        if (!params.name.trim())
            throw new Error('AccessPoint name is required');
        if (!params.managementIpId)
            throw new Error('AccessPoint must reference a management IP');
        if (!params.baseId)
            throw new Error('AccessPoint must belong to a base');
        if (!params.sector.trim())
            throw new Error('AccessPoint sector is required');
        if (params.latitude !== undefined && (params.latitude < -90 || params.latitude > 90)) {
            throw new Error('AccessPoint latitude must be between -90 and 90');
        }
        if (params.longitude !== undefined && (params.longitude < -180 || params.longitude > 180)) {
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
    get status() {
        return this._status;
    }
    goOnline() {
        if (this._status === 'online')
            throw new Error('AccessPoint is already online');
        this._status = 'online';
    }
    goOffline() {
        if (this._status === 'offline')
            throw new Error('AccessPoint is already offline');
        this._status = 'offline';
    }
    setMaintenance() {
        if (this._status === 'maintenance')
            throw new Error('AccessPoint is already in maintenance');
        this._status = 'maintenance';
    }
}
