import { DistanceCalculatorService } from '@/domain/common/DistanceCalculatorService';
import { ClientRepository } from '@/application/ports/repositories';
import { BaseRepository } from '@/application/ports/repositories';
import { AccessPointRepository } from '@/application/ports/repositories';

export interface ClientWithDistance {
  clientId: string;
  clientName: string;
  distance: number;
  latitude?: number;
  longitude?: number;
}

export interface NearestAccessPoint {
  accessPointId: string;
  accessPointName: string;
  baseName: string;
  distance: number;
  latitude?: number;
  longitude?: number;
}

/**
 * Use Case : Trouver les clients les plus proches d'un access point
 * Aide les techniciens à identifier rapidement les clients à proximité d'un AP
 */
export class FindClientsNearAccessPointUseCase {
  constructor(
    private clientRepo: ClientRepository,
    private accessPointRepo: AccessPointRepository
  ) {}

  async execute(accessPointId: string, maxDistance: number = 100): Promise<ClientWithDistance[]> {
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
  constructor(
    private clientRepo: ClientRepository,
    private accessPointRepo: AccessPointRepository,
    private baseRepo: BaseRepository
  ) {}

  async execute(clientId: string): Promise<NearestAccessPoint> {
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
  constructor(private clientRepo: ClientRepository) {}

  async execute(): Promise<Array<{ id: string; name: string; phoneNumber: string }>> {
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
