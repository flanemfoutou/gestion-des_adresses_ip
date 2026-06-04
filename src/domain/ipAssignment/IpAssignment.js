import { Entity } from '@/domain/common/Entity';
export class IpAssignment extends Entity {
    ipAddressId;
    clientId;
    assignedAt;
    _status;
    _releasedAt;
    constructor(params) {
        super(params.id);
        if (!params.ipAddressId)
            throw new Error('IpAssignment must reference an IP address');
        if (!params.clientId)
            throw new Error('IpAssignment must reference a client');
        this.ipAddressId = params.ipAddressId;
        this.clientId = params.clientId;
        this._status = params.status ?? 'assigned';
        this.assignedAt = params.assignedAt ?? new Date();
        this._releasedAt = params.releasedAt ?? null;
    }
    get status() {
        return this._status;
    }
    get releasedAt() {
        return this._releasedAt;
    }
    release() {
        if (this._status !== 'assigned')
            throw new Error('Only assigned IPs can be released');
        this._status = 'released';
        this._releasedAt = new Date();
    }
    markFailed() {
        if (this._status !== 'assigned')
            throw new Error('Only assigned IPs can be marked as failed');
        this._status = 'failed';
        this._releasedAt = new Date();
    }
}
