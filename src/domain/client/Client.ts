import { Entity } from '@/domain/common/Entity';
import { ClientType } from './ClientType';

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export class Client extends Entity<string> {
  fullName: string;
  phoneNumber: string;
  clientType: ClientType;
  accessPointId: string;
  ipAddressId: string;
  coordinates?: Coordinates;

  constructor(params: {
    id: string;
    fullName: string;
    phoneNumber: string;
    clientType: ClientType;
    accessPointId: string;
    ipAddressId: string;
    coordinates?: Coordinates;
  }) {
    super(params.id);
    if (!params.fullName.trim()) throw new Error('Client fullName is required');
    if (!params.phoneNumber.trim()) throw new Error('Client phoneNumber is required');
    if (!params.accessPointId) throw new Error('Client must belong to an access point');
    if (!params.ipAddressId) throw new Error('Client must have an IP address');

    if (params.coordinates) {
      if (!Number.isFinite(params.coordinates.latitude) || params.coordinates.latitude < -90 || params.coordinates.latitude > 90) {
        throw new Error('Client latitude must be between -90 and 90');
      }
      if (!Number.isFinite(params.coordinates.longitude) || params.coordinates.longitude < -180 || params.coordinates.longitude > 180) {
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