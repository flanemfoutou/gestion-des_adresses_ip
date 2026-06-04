import { SignalMonitoringService } from '@/application/services/SignalMonitoringService';

export class ListCpesNeedingRealignmentUseCase {
  constructor(private readonly signalMonitoring: SignalMonitoringService) {}

  async execute(accessPointId?: string) {
    return this.signalMonitoring.listCpesNeedingRealignment(accessPointId);
  }
}
