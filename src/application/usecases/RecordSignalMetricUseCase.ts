import { RecordSignalMetricPayload, SignalMonitoringService } from '@/application/services/SignalMonitoringService';

export class RecordSignalMetricUseCase {
  constructor(private readonly signalMonitoring: SignalMonitoringService) {}

  async execute(payload: RecordSignalMetricPayload) {
    return this.signalMonitoring.recordSignalMetric(payload);
  }
}
