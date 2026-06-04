import { Entity } from '@/domain/common/Entity';
import { SignalQuality, SignalEvaluation, SignalQualityCalculator } from './SignalQualityCalculator';

export class SignalMetric extends Entity<string> {
  readonly cpeId: string;
  readonly accessPointId: string;
  readonly rssi: number;
  readonly snr?: number;
  readonly txPower?: number;
  readonly rxPower?: number;
  readonly linkQuality?: number;
  readonly quality: SignalQuality;
  readonly distance?: number;
  readonly measuredAt: Date;
  readonly createdAt: Date;

  constructor(params: {
    id: string;
    cpeId: string;
    accessPointId: string;
    rssi: number;
    snr?: number;
    txPower?: number;
    rxPower?: number;
    linkQuality?: number;
    quality: SignalQuality;
    distance?: number;
    measuredAt?: Date;
    createdAt?: Date;
  }) {
    super(params.id);

    if (!params.cpeId) throw new Error('SignalMetric must reference a CPE');
    if (!params.accessPointId) throw new Error('SignalMetric must reference an AccessPoint');
    if (typeof params.rssi !== 'number') throw new Error('SignalMetric RSSI is required');

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

  get evaluation(): SignalEvaluation {
    return SignalQualityCalculator.evaluate(this.rssi, this.snr);
  }
}
