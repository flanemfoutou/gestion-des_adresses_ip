import { verifyToken } from '@/infrastructure/auth/jwt';
import { PgBaseRepository } from '@/infrastructure/repositories/PgBaseRepository';
import { PgAccessPointRepository } from '@/infrastructure/repositories/PgAccessPointRepository';
import { PgClientRepository } from '@/infrastructure/repositories/PgClientRepository';
import { PgIpAddressRepository } from '@/infrastructure/repositories/PgIpAddressRepository';
import { PgIpAssignmentRepository } from '@/infrastructure/repositories/PgIpAssignmentRepository';
import { PgNetworkRepository } from '@/infrastructure/repositories/PgNetworkRepository';
import { PgCpeDeviceRepository } from '@/infrastructure/repositories/PgCpeDeviceRepository';
import { PgSignalMetricRepository } from '@/infrastructure/repositories/PgSignalMetricRepository';
import { IpAllocationService } from '@/application/services/IpAllocationService';
import { SignalMonitoringService } from '@/application/services/SignalMonitoringService';
import { AssignIpToClientUseCase } from '@/application/usecases/AssignIpToClientUseCase';
import { ReleaseIpUseCase } from '@/application/usecases/ReleaseIpUseCase';
import { CreateCpeDeviceUseCase } from '@/application/usecases/CreateCpeDeviceUseCase';
import { UpdateCpeLocationUseCase } from '@/application/usecases/UpdateCpeLocationUseCase';
import { RecordSignalMetricUseCase } from '@/application/usecases/RecordSignalMetricUseCase';
import { GetSignalHistoryUseCase } from '@/application/usecases/GetSignalHistoryUseCase';
import { GetCurrentSignalUseCase } from '@/application/usecases/GetCurrentSignalUseCase';
import { GetFieldReportUseCase } from '@/application/usecases/GetFieldReportUseCase';
import { ListCpesNeedingRealignmentUseCase } from '@/application/usecases/ListCpesNeedingRealignmentUseCase';
import {
  FindClientsNearAccessPointUseCase,
  FindNearestAccessPointUseCase,
  ListClientsNeedingGeolocationUseCase,
} from '@/application/usecases/GeolocalizationUseCases';

export type AppContext = {
  user?: { id: string; roles: string[] };
  ipAllocation: {
    assignIp: AssignIpToClientUseCase;
    releaseIp: ReleaseIpUseCase;
  };
  signalMonitoring: {
    createCpeDevice: CreateCpeDeviceUseCase;
    updateCpeLocation: UpdateCpeLocationUseCase;
    recordSignalMetric: RecordSignalMetricUseCase;
    getSignalHistory: GetSignalHistoryUseCase;
    getCurrentSignal: GetCurrentSignalUseCase;
    getFieldReport: GetFieldReportUseCase;
    listCpesNeedingRealignment: ListCpesNeedingRealignmentUseCase;
  };
  geolocation: {
    findClientsNearAccessPoint: FindClientsNearAccessPointUseCase;
    findNearestAccessPoint: FindNearestAccessPointUseCase;
    listClientsNeedingGeolocation: ListClientsNeedingGeolocationUseCase;
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
  const cpeDeviceRepo = new PgCpeDeviceRepository();
  const signalMetricRepo = new PgSignalMetricRepository();
  const ipAllocationService = new IpAllocationService(ipAddressRepo, assignmentRepo, networkRepo);
  const signalMonitoringService = new SignalMonitoringService(
    cpeDeviceRepo,
    accessPointRepo,
    clientRepo,
    signalMetricRepo,
  );

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  const user = token ? verifyToken(token) : null;

  return {
    user: user ? { id: user.sub, roles: user.roles } : undefined,
    ipAllocation: {
      assignIp: new AssignIpToClientUseCase(ipAllocationService),
      releaseIp: new ReleaseIpUseCase(ipAllocationService),
    },
    signalMonitoring: {
      createCpeDevice: new CreateCpeDeviceUseCase(signalMonitoringService),
      updateCpeLocation: new UpdateCpeLocationUseCase(signalMonitoringService),
      recordSignalMetric: new RecordSignalMetricUseCase(signalMonitoringService),
      getSignalHistory: new GetSignalHistoryUseCase(signalMonitoringService),
      getCurrentSignal: new GetCurrentSignalUseCase(signalMonitoringService),
      getFieldReport: new GetFieldReportUseCase(signalMonitoringService),
      listCpesNeedingRealignment: new ListCpesNeedingRealignmentUseCase(signalMonitoringService),
    },
    geolocation: {
      findClientsNearAccessPoint: new FindClientsNearAccessPointUseCase(clientRepo, accessPointRepo),
      findNearestAccessPoint: new FindNearestAccessPointUseCase(clientRepo, accessPointRepo, baseRepo),
      listClientsNeedingGeolocation: new ListClientsNeedingGeolocationUseCase(clientRepo),
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