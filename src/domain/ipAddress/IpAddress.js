import { Entity } from '@/domain/common/Entity';
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
export class IpAddress extends Entity {
    address;
    usageType;
    reserved;
    active;
    networkId;
    _status;
    constructor(params) {
        super(params.id);
        if (!IP_REGEX.test(params.address))
            throw new Error('IpAddress is invalid (e.g. 192.168.1.10)');
        if (!params.networkId)
            throw new Error('IpAddress must reference a network');
        this.address = params.address;
        this._status = params.status ?? 'free';
        this.usageType = params.usageType ?? 'client';
        this.reserved = params.reserved ?? false;
        this.active = params.active ?? true;
        this.networkId = params.networkId;
    }
    get status() {
        return this._status;
    }
    assign() {
        if (!this.active)
            throw new Error('Cannot assign an inactive IP address');
        if (this.reserved)
            throw new Error('Cannot assign a reserved IP address');
        if (this._status !== 'free')
            throw new Error(`Cannot assign IP — current status: ${this._status}`);
        this._status = 'occupied';
    }
    release() {
        if (this._status !== 'occupied')
            throw new Error(`Cannot release IP — current status: ${this._status}`);
        this._status = 'free';
    }
    reserve() {
        if (this._status !== 'free')
            throw new Error(`Cannot reserve IP — current status: ${this._status}`);
        this._status = 'reserved';
    }
    decommission() {
        if (this._status === 'occupied')
            throw new Error('Cannot decommission an occupied IP — release it first');
        this._status = 'decommissioned';
    }
}
