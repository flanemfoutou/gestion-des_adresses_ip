import { Entity } from '@/domain/common/Entity';
import { ClientType } from './ClientType';

export class Client extends Entity<string> {
  readonly fullName: string;
  readonly phoneNumber: string;
  readonly clientType: ClientType;
  readonly accessPointId: string;
  readonly ipAddressId: string;

  constructor(params: {
    id: string;
    fullName: string;
    phoneNumber: string;
    clientType: ClientType;
    accessPointId: string;
    ipAddressId: string;
  }) {
    super(params.id);
    if (!params.fullName.trim()) throw new Error('Client fullName is required');
    if (!params.phoneNumber.trim()) throw new Error('Client phoneNumber is required');
    if (!params.accessPointId) throw new Error('Client must belong to an access point');
    if (!params.ipAddressId) throw new Error('Client must have an IP address');

    this.fullName = params.fullName;
    this.phoneNumber = params.phoneNumber;
    this.clientType = params.clientType;
    this.accessPointId = params.accessPointId;
    this.ipAddressId = params.ipAddressId;
  }
}