import { Entity } from '@/domain/common/Entity';
export class Client extends Entity {
    fullName;
    phoneNumber;
    clientType;
    accessPointId;
    ipAddressId;
    coordinates;
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
        if (params.coordinates) {
            if (params.coordinates.latitude < -90 || params.coordinates.latitude > 90) {
                throw new Error('Client latitude must be between -90 and 90');
            }
            if (params.coordinates.longitude < -180 || params.coordinates.longitude > 180) {
                throw new Error('Client longitude must be between -180 and 180');
            }
        }
        this.fullName = params.fullName;
        this.phoneNumber = params.phoneNumber;
        this.clientType = params.clientType;
        this.accessPointId = params.accessPointId;
        this.ipAddressId = params.ipAddressId;
        this.coordinates = params.coordinates;
    }
}
