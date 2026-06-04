import { Entity } from '@/domain/common/Entity';
import { SignalQualityCalculator } from './SignalQualityCalculator';
export class SignalMetric extends Entity {
    cpeId;
    accessPointId;
    rssi;
    snr;
    txPower;
    rxPower;
    linkQuality;
    quality;
    distance;
    measuredAt;
    createdAt;
    constructor(params) {
        super(params.id);
        if (!params.cpeId)
            throw new Error('SignalMetric must reference a CPE');
        if (!params.accessPointId)
            throw new Error('SignalMetric must reference an AccessPoint');
        if (typeof params.rssi !== 'number')
            throw new Error('SignalMetric RSSI is required');
        this.cpeId = params.cpeId;
        this.accessPointId = params.accessPointId;
        this.rssi = params.rssi;
        this.snr = params.snr;
        this.txPower = params.txPower;
        this.rxPower = params.rxPower;
        this.linkQuality = params.linkQuality;
        this.quality = params.quality;
        this.distance = params.distance;
        this.measuredAt = params.measuredAt ?? new Date();
        this.createdAt = params.createdAt ?? new Date();
    }
    get evaluation() {
        return SignalQualityCalculator.evaluate(this.rssi, this.snr);
    }
}
