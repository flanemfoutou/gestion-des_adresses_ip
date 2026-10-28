import { IpAssignment } from "@/domain/ipAssignment/IpAssignment";
import { CidrService } from "@/application/services/CidrService";
import { v4 as uuidv4 } from 'uuid';
export class IpAllocationService {
    ipAddressRepo;
    assignmentRepo;
    networkRepo;
    constructor(ipAddressRepo, assignmentRepo, networkRepo) {
        this.ipAddressRepo = ipAddressRepo;
        this.assignmentRepo = assignmentRepo;
        this.networkRepo = networkRepo;
    }
    async allocateToClient({ clientId, accessPointId, networkId }) {
        const network = await this.networkRepo.findById(networkId);
        if (!network)
            throw new Error('Network not found');
        const existingIps = await this.ipAddressRepo.findAvailableByNetwork(networkId, 1);
        if (existingIps.length === 0) {
            const allHosts = CidrService.iterateHosts(network.cidr);
            throw new Error(`No available IP left in network ${network.cidr}. Candidate range start: ${allHosts[0]}`);
        }
        const ip = existingIps[0];
        if (ip.status !== 'free')
            throw new Error('Selected IP is not free');
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
    async releaseIp(ipId) {
        const ip = await this.ipAddressRepo.findById(ipId);
        if (!ip)
            throw new Error('IP address not found');
        if (ip.status !== 'occupied')
            throw new Error('Only occupied IP addresses can be released');
        const network = await this.networkRepo.findById(ip.networkId);
        if (!network)
            throw new Error('Network not found for IP address');
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
