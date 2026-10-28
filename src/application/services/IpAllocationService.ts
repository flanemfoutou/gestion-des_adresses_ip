import { IpAddress } from "@/domain/ipAddress/IpAddress";
import { IpAssignment } from "@/domain/ipAssignment/IpAssignment";
import { CidrService } from "@/application/services/CidrService";
import { IpAddressRepository, IpAssignmentRepository, NetworkRepository } from "@/application/ports/repositories";
import { v4 as uuidv4 } from 'uuid';

export class IpAllocationService {
  constructor(
    private readonly ipAddressRepo: IpAddressRepository,
    private readonly assignmentRepo: IpAssignmentRepository,
    private readonly networkRepo: NetworkRepository,
  ) {}

  async allocateToClient({
    clientId,
    accessPointId,
    networkId,
    ipAddressId,
  }: {
    clientId: string;
    accessPointId: string;
    networkId: string;
    ipAddressId?: string;
  }): Promise<IpAssignment> {
    const network = await this.networkRepo.findById(networkId);
    if (!network) throw new Error('Network not found');

    let ip: IpAddress | null;
    if (ipAddressId) {
      ip = await this.ipAddressRepo.findById(ipAddressId);
      if (!ip) throw new Error('IP address not found');
      if (ip.networkId !== networkId) {
        throw new Error('Selected IP address does not belong to the requested network');
      }
    } else {
      const existingIps = await this.ipAddressRepo.findAvailableByNetwork(networkId, 1);
      ip = existingIps[0] ?? null;
      if (!ip) {
        const allHosts = CidrService.iterateHosts(network.cidr);
        throw new Error(`No available IP left in network ${network.cidr}. Candidate range start: ${allHosts[0]}`);
      }
    }

    if (ip.status !== 'free' || ip.reserved || !ip.active) {
      throw new Error('Selected IP is not available');
    }

    const assignment = new IpAssignment({
      id: uuidv4(),
      ipAddressId: ip.id,
      clientId,
      accessPointId,
      assignedAt: new Date(),
      status: 'assigned',
    });

    ip.assign();
    await this.ipAddressRepo.save(ip);
    await this.assignmentRepo.save(assignment);
    return assignment;
  }

  async releaseIp(ipId: string): Promise<void> {
    const ip = await this.ipAddressRepo.findById(ipId);
    if (!ip) throw new Error('IP address not found');
    if (ip.status !== 'occupied') throw new Error('Only occupied IP addresses can be released');

    const network = await this.networkRepo.findById(ip.networkId);
    if (!network) throw new Error('Network not found for IP address');

    const assignment = new IpAssignment({
      id: uuidv4(),
      ipAddressId: ip.id,
      clientId: null,
      accessPointId: network.accessPointId,
      assignedAt: new Date(),
      releasedAt: new Date(),
      status: 'released',
    });

    ip.release();
    await this.ipAddressRepo.save(ip);
    await this.assignmentRepo.save(assignment);
  }
}
