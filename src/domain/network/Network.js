import { Entity } from '@/domain/common/Entity';
import { IpCalculatorService } from './IpCalculatorService';
const CIDR_REGEX = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
export class Network extends Entity {
    cidr;
    gateway;
    vlan;
    accessPointId;
    // Computed from CIDR
    networkAddress;
    broadcastAddress;
    subnetMask;
    wildcardMask;
    usableStart;
    usableEnd;
    totalHosts;
    prefix;
    isPrivate;
    constructor(params) {
        super(params.id);
        if (!CIDR_REGEX.test(params.cidr))
            throw new Error('Network CIDR is invalid (e.g. 192.168.1.0/24)');
        if (!IP_REGEX.test(params.gateway))
            throw new Error('Network gateway is invalid (e.g. 192.168.1.1)');
        if (!Number.isInteger(params.vlan) || params.vlan < 1 || params.vlan > 4094)
            throw new Error('Network VLAN must be between 1 and 4094');
        if (!params.accessPointId)
            throw new Error('Network must reference an access point');
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
