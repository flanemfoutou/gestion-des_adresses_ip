import { Entity } from '@/domain/common/Entity';
export class CpeDevice extends Entity {
    clientId;
    accessPointId;
    model;
    macAddress;
    coordinates;
    azimuth;
    createdAt;
    updatedAt;
    constructor(params) {
        super(params.id);
        if (!params.clientId)
            throw new Error('CPE doit référencer un client');
        if (!params.accessPointId)
            throw new Error('CPE doit référencer un point d\'accès');
        if (!params.model.trim())
            throw new Error('Le modèle du CPE est requis');
        if (!params.macAddress.trim())
            throw new Error('L\'adresse MAC du CPE est requise');
        if (params.coordinates) {
            const { latitude, longitude } = params.coordinates;
            if (latitude < -90 || latitude > 90)
                throw new Error('Latitude du CPE invalide');
            if (longitude < -180 || longitude > 180)
                throw new Error('Longitude du CPE invalide');
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
    withLocation(coordinates, azimuth) {
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
