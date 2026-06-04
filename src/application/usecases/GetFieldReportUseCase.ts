import { SignalMonitoringService } from '@/application/services/SignalMonitoringService';

export class GetFieldReportUseCase {
  constructor(private readonly signalMonitoring: SignalMonitoringService) {}

  async execute(cpeId: string) {
    return this.signalMonitoring.getFieldReport(cpeId);
  }
}
