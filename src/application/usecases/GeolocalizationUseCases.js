import { DistanceCalculatorService } from '@/domain/common/DistanceCalculatorService';
/**
 * Use Case : Trouver les clients les plus proches d'un access point
 * Aide les techniciens à identifier rapidement les clients à proximité d'un AP
 */
export class FindClientsNearAccessPointUseCase {
    clientRepo;
    accessPointRepo;
    constructor(clientRepo, accessPointRepo) {
        this.clientRepo = clientRepo;
        this.accessPointRepo = accessPointRepo;
    }
    async execute(accessPointId, maxDistance = 100) {
        const ap = await this.accessPointRepo.findById(accessPointId);
        if (!ap || !ap.coordinates) {
            throw new Error(`Access point ${accessPointId} not found or has no coordinates`);
        }
        const clients = await this.clientRepo.findAll();
        const clientsNearAp = clients.filter(c => c.coordinates !== undefined);
        const sortedClients = DistanceCalculatorService.sortByDistance(ap.coordinates, clientsNearAp);
        return sortedClients
            .filter(c => c.distance <= maxDistance)
            .map(c => ({
            clientId: c.id,
            clientName: c.fullName,
            distance: Math.round(c.distance * 100) / 100,
            latitude: c.coordinates?.latitude,
            longitude: c.coordinates?.longitude,
        }));
    }
}
/**
 * Use Case : Trouver l'access point le plus proche d'un client
 * Affiche aux techniciens quel site est le plus pertinent pour installer/servir un client
 */
export class FindNearestAccessPointUseCase {
    clientRepo;
    accessPointRepo;
    baseRepo;
    constructor(clientRepo, accessPointRepo, baseRepo) {
        this.clientRepo = clientRepo;
        this.accessPointRepo = accessPointRepo;
        this.baseRepo = baseRepo;
    }
    async execute(clientId) {
        const client = await this.clientRepo.findById(clientId);
        if (!client || !client.coordinates) {
            throw new Error(`Client ${clientId} not found or has no coordinates`);
        }
        const accessPoints = await this.accessPointRepo.findAll();
        const apsWithCoordinates = accessPoints.filter(ap => ap.coordinates !== undefined);
        if (apsWithCoordinates.length === 0) {
            throw new Error('No access points with coordinates available');
        }
        const nearest = DistanceCalculatorService.findClosest(client.coordinates, apsWithCoordinates);
        if (!nearest) {
            throw new Error('Could not calculate nearest access point');
        }
        const base = await this.baseRepo.findById(nearest.item.baseId);
        return {
            accessPointId: nearest.item.id,
            accessPointName: nearest.item.name,
            baseName: base?.name || 'Unknown Base',
            distance: Math.round(nearest.distance * 100) / 100,
            latitude: nearest.item.coordinates?.latitude,
            longitude: nearest.item.coordinates?.longitude,
        };
    }
}
/**
 * Use Case : Lister les clients sans coordonnées (qui ont besoin d'une géolocalisation)
 */
export class ListClientsNeedingGeolocationUseCase {
    clientRepo;
    constructor(clientRepo) {
        this.clientRepo = clientRepo;
    }
    async execute() {
        const clients = await this.clientRepo.findAll();
        return clients
            .filter(c => !c.coordinates)
            .map(c => ({
            id: c.id,
            name: c.fullName,
            phoneNumber: c.phoneNumber,
        }));
    }
}
