import { v4 as uuidv4 } from 'uuid';
import { CpeDevice } from '@/domain/cpeDevice/CpeDevice';
import { SignalMetric } from '@/domain/signal/SignalMetric';
import { SignalQualityCalculator } from '@/domain/signal/SignalQualityCalculator';
export class SignalMonitoringService {
    cpeRepo;
    accessPointRepo;
    clientRepo;
    signalMetricRepo;
    constructor(cpeRepo, accessPointRepo, clientRepo, signalMetricRepo) {
        this.cpeRepo = cpeRepo;
        this.accessPointRepo = accessPointRepo;
        this.clientRepo = clientRepo;
        this.signalMetricRepo = signalMetricRepo;
    }
    async createCpeDevice(payload) {
        const client = await this.clientRepo.findById(payload.clientId);
        if (!client)
            throw new Error('Client introuvable');
        const accessPoint = await this.accessPointRepo.findById(payload.accessPointId);
        if (!accessPoint)
            throw new Error('AccessPoint introuvable');
        const cpe = new CpeDevice({
            id: uuidv4(),
            clientId: payload.clientId,
            accessPointId: payload.accessPointId,
            model: payload.model,
            macAddress: payload.macAddress,
            coordinates: payload.coordinates,
            azimuth: payload.azimuth,
        });
        await this.cpeRepo.save(cpe);
        return cpe;
    }
    async updateCpeLocation(payload) {
        const cpe = await this.cpeRepo.findById(payload.id);
        if (!cpe)
            throw new Error('CPE introuvable');
        const updated = cpe.withLocation(payload.coordinates, payload.azimuth);
        await this.cpeRepo.save(updated);
        return updated;
    }
    async recordSignalMetric(payload) {
        const cpe = await this.cpeRepo.findById(payload.cpeId);
        if (!cpe)
            throw new Error('CPE introuvable');
        if (cpe.accessPointId !== payload.accessPointId) {
            throw new Error('Le CPE n\'est pas attaché à ce point d\'accès');
        }
        const accessPoint = await this.accessPointRepo.findById(payload.accessPointId);
        if (!accessPoint)
            throw new Error('AccessPoint introuvable');
        const evaluation = SignalQualityCalculator.evaluate(payload.rssi, payload.snr);
        const distance = this.calculateDistance(cpe, accessPoint);
        const metric = new SignalMetric({
            id: uuidv4(),
            cpeId: payload.cpeId,
            accessPointId: payload.accessPointId,
            rssi: payload.rssi,
            snr: payload.snr,
            txPower: payload.txPower,
            rxPower: payload.rxPower,
            linkQuality: payload.linkQuality,
            quality: evaluation.quality,
            distance,
            measuredAt: new Date(),
        });
        await this.signalMetricRepo.save(metric);
        return metric;
    }
    async getSignalHistory(cpeId, limit = 20) {
        const cpe = await this.cpeRepo.findById(cpeId);
        if (!cpe)
            throw new Error('CPE introuvable');
        return this.signalMetricRepo.findByCpeId(cpeId, limit, 0);
    }
    async getCurrentSignal(cpeId) {
        const cpe = await this.cpeRepo.findById(cpeId);
        if (!cpe)
            throw new Error('CPE introuvable');
        return this.signalMetricRepo.findLatestByCpeId(cpeId);
    }
    async getFieldReport(cpeId) {
        const cpe = await this.cpeRepo.findById(cpeId);
        if (!cpe)
            throw new Error('CPE introuvable');
        const accessPoint = await this.accessPointRepo.findById(cpe.accessPointId);
        if (!accessPoint)
            throw new Error('AccessPoint introuvable');
        const latestSignal = await this.signalMetricRepo.findLatestByCpeId(cpeId);
        if (!latestSignal)
            throw new Error('Aucune métrique de signal disponible pour ce CPE');
        const signalHistory = await this.signalMetricRepo.findByCpeId(cpeId, 20, 0);
        const distanceMeters = latestSignal.distance ?? this.calculateDistance(cpe, accessPoint);
        const evaluation = latestSignal.evaluation;
        return {
            cpe,
            accessPoint,
            latestSignal,
            evaluation,
            distanceMeters,
            signalHistory,
        };
    }
    async listCpesNeedingRealignment(accessPointId) {
        const cpes = accessPointId
            ? await this.cpeRepo.findByAccessPointId(accessPointId)
            : await this.cpeRepo.findAll();
        const reports = [];
        for (const cpe of cpes) {
            const latestSignal = await this.signalMetricRepo.findLatestByCpeId(cpe.id);
            if (!latestSignal)
                continue;
            if (latestSignal.rssi >= -75)
                continue;
            const accessPoint = await this.accessPointRepo.findById(cpe.accessPointId);
            if (!accessPoint)
                continue;
            const signalHistory = await this.signalMetricRepo.findByCpeId(cpe.id, 20, 0);
            const distanceMeters = latestSignal.distance ?? this.calculateDistance(cpe, accessPoint);
            const evaluation = latestSignal.evaluation;
            reports.push({
                cpe,
                accessPoint,
                latestSignal,
                evaluation,
                distanceMeters,
                signalHistory,
            });
        }
        return reports;
    }
    calculateDistance(cpe, accessPoint) {
        if (!cpe.coordinates || !accessPoint.latitude || !accessPoint.longitude)
            return undefined;
        if (accessPoint.latitude === null || accessPoint.longitude === null)
            return undefined;
        return SignalQualityCalculator.calculateDistance(cpe.coordinates.latitude, cpe.coordinates.longitude, Number(accessPoint.latitude), Number(accessPoint.longitude));
    }
}
