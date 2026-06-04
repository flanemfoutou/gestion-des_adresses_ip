import { SignalMonitoringService, UpdateCpeLocationPayload } from '@/application/services/SignalMonitoringService';

export class UpdateCpeLocationUseCase {
  constructor(private readonly signalMonitoring: SignalMonitoringService) {}

  async execute(payload: UpdateCpeLocationPayload) {
    return this.signalMonitoring.updateCpeLocation(payload);
  }
}
