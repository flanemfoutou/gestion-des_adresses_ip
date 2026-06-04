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

  async allocateToClient({ clientId, accessPointId, networkId }: { clientId: string; accessPointId: string; networkId: string }): Promise<IpAssignment> {
    const network = await this.networkRepo.findById(networkId);
    if (!network) throw new Error('Network not found');

    const existingIps = await this.ipAddressRepo.findAvailableByNetwork(networkId, 1);
    if (existingIps.length === 0) {
      const allHosts = CidrService.iterateHosts(network.cidr);
      throw new Error(`No available IP left in network ${network.cidr}. Candidate range start: ${allHosts[0]}`);
    }

    const ip = existingIps[0];
    if (ip.status !== 'free') throw new Error('Selected IP is not free');

    const assignment = new IpAssignment({
      id: uuidv4(),
      ipAddressId: ip.id,
      clientId,
      accessPointId,
      assignedAt: new Date(),
      status: 'assigned',
    });

    ip.status = 'occupied';
    await this.ipAddressRepo.save(ip);
    await this.assignmentRepo.save(assignment);
    return assignment;
  }

  async releaseIp(ipId: string): Promise<void> {
    const ip = await this.ipAddressRepo.findById(ipId);
    if (!ip) throw new Error('IP address not found');
    if (ip.status !== 'occupied') throw new Error('Only occupied IP addresses can be released');

    const assignment = new IpAssignment({
      id: uuidv4(),
      ipAddressId: ip.id,
      clientId: null,
      accessPointId: ip.networkId,
      assignedAt: new Date(),
      releasedAt: new Date(),
      status: 'released',
    });

    ip.status = 'free';
    await this.ipAddressRepo.save(ip);
    await this.assignmentRepo.save(assignment);
  }
}
