export class RecordSignalMetricUseCase {
    signalMonitoring;
    constructor(signalMonitoring) {
        this.signalMonitoring = signalMonitoring;
    }
    async execute(payload) {
        return this.signalMonitoring.recordSignalMetric(payload);
    }
}
