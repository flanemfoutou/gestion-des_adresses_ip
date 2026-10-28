import { Entity } from '@/domain/common/Entity';
export class Base extends Entity {
    name;
    location;
    latitude;
    longitude;
    altitude;
    _status;
    constructor(params) {
        super(params.id);
        if (!params.name.trim())
            throw new Error('Base name is required');
        if (!params.location.trim())
            throw new Error('Base location is required');
        if (params.latitude !== undefined && (params.latitude < -90 || params.latitude > 90)) {
            throw new Error('Base latitude must be between -90 and 90');
        }
        if (params.longitude !== undefined && (params.longitude < -180 || params.longitude > 180)) {
            throw new Error('Base longitude must be between -180 and 180');
        }
        this.name = params.name;
        this.location = params.location;
        this.latitude = params.latitude;
        this.longitude = params.longitude;
        this.altitude = params.altitude;
        this._status = params.status ?? 'active';
    }
    get coordinates() {
        if (this.latitude !== undefined && this.longitude !== undefined) {
            return {
                latitude: this.latitude,
                longitude: this.longitude,
                altitude: this.altitude,
            };
        }
        return undefined;
    }
    get status() {
        return this._status;
    }
    activate() {
        if (this._status === 'active')
            throw new Error('Base is already active');
        this._status = 'active';
    }
    deactivate() {
        if (this._status === 'inactive')
            throw new Error('Base is already inactive');
        this._status = 'inactive';
    }
    setMaintenance() {
        if (this._status === 'maintenance')
            throw new Error('Base is already in maintenance');
        this._status = 'maintenance';
    }
}
