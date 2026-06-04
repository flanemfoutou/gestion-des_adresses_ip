export class GetFieldReportUseCase {
    signalMonitoring;
    constructor(signalMonitoring) {
        this.signalMonitoring = signalMonitoring;
    }
    async execute(cpeId) {
        return this.signalMonitoring.getFieldReport(cpeId);
    }
}
