export type SignalQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export interface SignalEvaluation {
  quality: SignalQuality;
  needsRealignment: boolean;
  recommendation: string;
}

export class SignalQualityCalculator {
  static evaluate(rssi: number, snr?: number): SignalEvaluation {
    const quality = this.getQuality(rssi);
    const needsRealignment = rssi < -75;

    return {
      quality,
      needsRealignment,
      recommendation: this.getRecommendation(rssi, snr),
    };
  }

  private static getQuality(rssi: number): SignalQuality {
    if (rssi > -60) return 'excellent';
    if (rssi > -70) return 'good';
    if (rssi > -75) return 'fair';
    if (rssi > -80) return 'poor';
    return 'critical';
  }

  private static getRecommendation(rssi: number, snr?: number): string {
    if (rssi > -60) return 'Signal excellent — aucune action requise';
    if (rssi > -70) return 'Signal bon — surveillance recommandée';
    if (rssi > -75) return 'Signal moyen — vérifier l\'orientation de l\'antenne';
    if (rssi > -80) return 'Signal faible — réalignement AP/CPE requis';
    return 'Signal critique — intervention urgente requise';
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
