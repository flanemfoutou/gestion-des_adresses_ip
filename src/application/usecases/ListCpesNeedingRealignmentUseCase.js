export class ListCpesNeedingRealignmentUseCase {
    signalMonitoring;
    constructor(signalMonitoring) {
        this.signalMonitoring = signalMonitoring;
    }
    async execute(accessPointId) {
        return this.signalMonitoring.listCpesNeedingRealignment(accessPointId);
    }
}
