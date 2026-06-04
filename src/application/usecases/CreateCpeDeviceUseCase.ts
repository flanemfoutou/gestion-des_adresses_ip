import { CreateCpeDevicePayload, SignalMonitoringService } from '@/application/services/SignalMonitoringService';

export class CreateCpeDeviceUseCase {
  constructor(private readonly signalMonitoring: SignalMonitoringService) {}

  async execute(payload: CreateCpeDevicePayload) {
    return this.signalMonitoring.createCpeDevice(payload);
  }
}
