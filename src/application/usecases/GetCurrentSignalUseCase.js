export class GetCurrentSignalUseCase {
    signalMonitoring;
    constructor(signalMonitoring) {
        this.signalMonitoring = signalMonitoring;
    }
    async execute(cpeId) {
        return this.signalMonitoring.getCurrentSignal(cpeId);
    }
}
