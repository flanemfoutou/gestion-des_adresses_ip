export class GetSignalHistoryUseCase {
    signalMonitoring;
    constructor(signalMonitoring) {
        this.signalMonitoring = signalMonitoring;
    }
    async execute(cpeId, limit = 20) {
        return this.signalMonitoring.getSignalHistory(cpeId, limit);
    }
}
