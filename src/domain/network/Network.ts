import { Entity } from '@/domain/common/Entity';
import { IpCalculatorService } from './IpCalculatorService';

const CIDR_REGEX = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

export class Network extends Entity<string> {
  readonly cidr: string;
  readonly gateway: string;
  readonly vlan: number;
  readonly accessPointId: string;

  // Computed from CIDR
  readonly networkAddress: string;
  readonly broadcastAddress: string;
  readonly subnetMask: string;
  readonly wildcardMask: string;
  readonly usableStart: string;
  readonly usableEnd: string;
  readonly totalHosts: number;
  readonly prefix: number;
  readonly isPrivate: boolean;

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

    // Calculate CIDR information
    const cidrInfo = IpCalculatorService.fromCidr(params.cidr);
    this.networkAddress = cidrInfo.networkAddress;
    this.broadcastAddress = cidrInfo.broadcastAddress;
    this.subnetMask = cidrInfo.subnetMask;
    this.wildcardMask = cidrInfo.wildcardMask;
    this.usableStart = cidrInfo.usableStart;
    this.usableEnd = cidrInfo.usableEnd;
    this.totalHosts = cidrInfo.totalHosts;
    this.prefix = cidrInfo.prefix;
    this.isPrivate = cidrInfo.isPrivate;
  }
}