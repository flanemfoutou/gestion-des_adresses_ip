import { Entity } from '@/domain/common/Entity';

export type Coordinates = {
  latitude: number;
  longitude: number;
  altitude?: number;
};

export class CpeDevice extends Entity<string> {
  readonly clientId: string;
  readonly accessPointId: string;
  readonly model: string;
  readonly macAddress: string;
  readonly coordinates?: Coordinates;
  readonly azimuth?: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: string;
    clientId: string;
    accessPointId: string;
    model: string;
    macAddress: string;
    coordinates?: Coordinates;
    azimuth?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.id);

    if (!params.clientId) throw new Error('CPE doit référencer un client');
    if (!params.accessPointId) throw new Error('CPE doit référencer un point d\'accès');
    if (!params.model.trim()) throw new Error('Le modèle du CPE est requis');
    if (!params.macAddress.trim()) throw new Error('L\'adresse MAC du CPE est requise');

    if (params.coordinates) {
      const { latitude, longitude } = params.coordinates;
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error('Latitude du CPE invalide');
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error('Longitude du CPE invalide');
    }

    this.clientId = params.clientId;
    this.accessPointId = params.accessPointId;
    this.model = params.model;
    this.macAddress = params.macAddress;
    this.coordinates = params.coordinates;
    this.azimuth = params.azimuth;
    this.createdAt = params.createdAt ?? new Date();
    this.updatedAt = params.updatedAt ?? new Date();
  }

  withLocation(coordinates: Coordinates, azimuth?: number): CpeDevice {
    return new CpeDevice({
      id: this.id,
      clientId: this.clientId,
      accessPointId: this.accessPointId,
      model: this.model,
      macAddress: this.macAddress,
      coordinates,
      azimuth: azimuth ?? this.azimuth,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
