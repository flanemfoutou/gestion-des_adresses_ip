import { Entity } from '@/domain/common/Entity';

const CIDR_REGEX = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

export class Network extends Entity<string> {
  readonly cidr: string;
  readonly gateway: string;
  readonly vlan: number;
  readonly accessPointId: string;

  constructor(params: {
    id: string;
    cidr: string;
    gateway: string;
    vlan: number;
    accessPointId: string;
  }) {
    super(params.id);
    if (!CIDR_REGEX.test(params.cidr)) throw new Error('Network CIDR is invalid (e.g. 192.168.1.0/24)');
    if (!IP_REGEX.test(params.gateway)) throw new Error('Network gateway is invalid (e.g. 192.168.1.1)');
    if (!Number.isInteger(params.vlan) || params.vlan < 1 || params.vlan > 4094)
      throw new Error('Network VLAN must be between 1 and 4094');
    if (!params.accessPointId) throw new Error('Network must reference an access point');

    this.cidr = params.cidr;
    this.gateway = params.gateway;
    this.vlan = params.vlan;
    this.accessPointId = params.accessPointId;
  }
}