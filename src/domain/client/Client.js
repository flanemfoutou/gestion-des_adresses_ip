import { Entity } from '@/domain/common/Entity';
export class Client extends Entity {
    fullName;
    phoneNumber;
    clientType;
    accessPointId;
    ipAddressId;
    constructor(params) {
        super(params.id);
        if (!params.fullName.trim())
            throw new Error('Client fullName is required');
        if (!params.phoneNumber.trim())
            throw new Error('Client phoneNumber is required');
        if (!params.accessPointId)
            throw new Error('Client must belong to an access point');
        if (!params.ipAddressId)
            throw new Error('Client must have an IP address');
        this.fullName = params.fullName;
        this.phoneNumber = params.phoneNumber;
        this.clientType = params.clientType;
        this.accessPointId = params.accessPointId;
        this.ipAddressId = params.ipAddressId;
    }
}
