export class UpdateCpeLocationUseCase {
    signalMonitoring;
    constructor(signalMonitoring) {
        this.signalMonitoring = signalMonitoring;
    }
    async execute(payload) {
        return this.signalMonitoring.updateCpeLocation(payload);
    }
}
