export class CreateCpeDeviceUseCase {
    signalMonitoring;
    constructor(signalMonitoring) {
        this.signalMonitoring = signalMonitoring;
    }
    async execute(payload) {
        return this.signalMonitoring.createCpeDevice(payload);
    }
}
