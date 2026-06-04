import { SignalMonitoringService } from '@/application/services/SignalMonitoringService';

export class GetSignalHistoryUseCase {
  constructor(private readonly signalMonitoring: SignalMonitoringService) {}

  async execute(cpeId: string, limit = 20) {
    return this.signalMonitoring.getSignalHistory(cpeId, limit);
  }
}
