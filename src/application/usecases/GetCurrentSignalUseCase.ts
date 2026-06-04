import { SignalMonitoringService } from '@/application/services/SignalMonitoringService';

export class GetCurrentSignalUseCase {
  constructor(private readonly signalMonitoring: SignalMonitoringService) {}

  async execute(cpeId: string) {
    return this.signalMonitoring.getCurrentSignal(cpeId);
  }
}
