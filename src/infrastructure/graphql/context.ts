import { verifyToken } from '@/infrastructure/auth/jwt';
import { PgBaseRepository } from '@/infrastructure/repositories/PgBaseRepository';
import { PgAccessPointRepository } from '@/infrastructure/repositories/PgAccessPointRepository';
import { PgClientRepository } from '@/infrastructure/repositories/PgClientRepository';
import { PgIpAddressRepository } from '@/infrastructure/repositories/PgIpAddressRepository';
import { PgIpAssignmentRepository } from '@/infrastructure/repositories/PgIpAssignmentRepository';
import { PgNetworkRepository } from '@/infrastructure/repositories/PgNetworkRepository';
import { IpAllocationService } from '@/application/services/IpAllocationService';
import { AssignIpToClientUseCase } from '@/application/usecases/AssignIpToClientUseCase';
import { ReleaseIpUseCase } from '@/application/usecases/ReleaseIpUseCase';

export type AppContext = {
  user?: { id: string; roles: string[] };
  ipAllocation: {
    assignIp: AssignIpToClientUseCase;
    releaseIp: ReleaseIpUseCase;
  };
  repositories: {
    baseRepo: PgBaseRepository;
    accessPointRepo: PgAccessPointRepository;
    clientRepo: PgClientRepository;
    ipAddressRepo: PgIpAddressRepository;
    networkRepo: PgNetworkRepository;
    assignmentRepo: PgIpAssignmentRepository;
  };
};

export function createContext({ request }: { request: Request }): AppContext {
  const baseRepo = new PgBaseRepository();
  const ipAddressRepo = new PgIpAddressRepository();
  const assignmentRepo = new PgIpAssignmentRepository();
  const networkRepo = new PgNetworkRepository();
  const accessPointRepo = new PgAccessPointRepository();
  const clientRepo = new PgClientRepository();
  const ipAllocationService = new IpAllocationService(ipAddressRepo, assignmentRepo, networkRepo);

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  const user = token ? verifyToken(token) : null;

  return {
    user: user ? { id: user.sub, roles: user.roles } : undefined,
    ipAllocation: {
      assignIp: new AssignIpToClientUseCase(ipAllocationService),
      releaseIp: new ReleaseIpUseCase(ipAllocationService),
    },
    repositories: {
      baseRepo,
      accessPointRepo,
      clientRepo,
      ipAddressRepo,
      networkRepo,
      assignmentRepo,
    },
  };
}