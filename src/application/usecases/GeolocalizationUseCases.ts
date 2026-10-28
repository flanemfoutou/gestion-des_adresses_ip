import { DistanceCalculatorService } from '@/domain/common/DistanceCalculatorService';
import type { Coordinates } from '@/domain/common/DistanceCalculatorService';
import type {
  AccessPointRepository,
  BaseRepository,
  ClientRepository,
  CpeDeviceRepository,
} from '@/application/ports/repositories';

function hasCoordinates<T extends { coordinates?: Coordinates }>(
  item: T,
): item is T & { coordinates: Coordinates } {
  return item.coordinates !== undefined;
}

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

export interface NearestAccessPointAtPosition {
  accessPointId: string;
  accessPointName: string;
  baseName: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
}

export type MapEntityKind = 'base' | 'accessPoint' | 'client' | 'cpe';

export interface MapLocation {
  id: string;
  kind: MapEntityKind;
  name: string;
  parentName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  azimuth: number | null;
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
    const clientsNearAp = clients.filter(hasCoordinates);

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

    const nearest = await this.findNearest(client.coordinates);
    return {
      accessPointId: nearest.accessPointId,
      accessPointName: nearest.accessPointName,
      baseName: nearest.baseName,
      distance: Math.round((nearest.distanceMeters / 1000) * 100) / 100,
      latitude: nearest.latitude,
      longitude: nearest.longitude,
    };
  }

  async executeAtPosition(coordinates: Coordinates): Promise<NearestAccessPointAtPosition> {
    return this.findNearest(coordinates);
  }

  private async findNearest(coordinates: Coordinates): Promise<NearestAccessPointAtPosition> {
    const accessPoints = await this.accessPointRepo.findAll();
    const apsWithCoordinates = accessPoints.filter(hasCoordinates);

    if (apsWithCoordinates.length === 0) {
      throw new Error('No access points with coordinates available');
    }

    const nearest = DistanceCalculatorService.findClosest(coordinates, apsWithCoordinates);
    if (!nearest) {
      throw new Error('Could not calculate nearest access point');
    }

    const base = await this.baseRepo.findById(nearest.item.baseId);

    return {
      accessPointId: nearest.item.id,
      accessPointName: nearest.item.name,
      baseName: base?.name || 'Unknown Base',
      distanceMeters: Math.round(nearest.distance * 100000) / 100,
      latitude: nearest.item.coordinates.latitude,
      longitude: nearest.item.coordinates.longitude,
    };
  }
}

export class ListMapLocationsUseCase {
  constructor(
    private readonly baseRepo: BaseRepository,
    private readonly accessPointRepo: AccessPointRepository,
    private readonly clientRepo: ClientRepository,
    private readonly cpeRepo: CpeDeviceRepository,
  ) {}

  async execute(): Promise<MapLocation[]> {
    const [bases, accessPoints, clients, cpes] = await Promise.all([
      this.baseRepo.findAll(),
      this.accessPointRepo.findAll(),
      this.clientRepo.findAll(),
      this.cpeRepo.findAll(),
    ]);

    const basesById = new Map(bases.map((base) => [base.id, base]));
    const accessPointsById = new Map(accessPoints.map((point) => [point.id, point]));
    const clientsById = new Map(clients.map((client) => [client.id, client]));

    return [
      ...bases.map((base): MapLocation => ({
        id: base.id,
        kind: 'base',
        name: base.name,
        parentName: base.location,
        address: base.location,
        latitude: base.latitude ?? null,
        longitude: base.longitude ?? null,
        altitude: base.altitude ?? null,
        azimuth: null,
      })),
      ...accessPoints.map((point): MapLocation => ({
        id: point.id,
        kind: 'accessPoint',
        name: point.name,
        parentName: basesById.get(point.baseId)?.name ?? null,
        address: basesById.get(point.baseId)?.location ?? null,
        latitude: point.latitude ?? null,
        longitude: point.longitude ?? null,
        altitude: point.altitude ?? null,
        azimuth: point.azimuth ?? null,
      })),
      ...clients.map((client): MapLocation => ({
        id: client.id,
        kind: 'client',
        name: client.fullName,
        parentName: accessPointsById.get(client.accessPointId)?.name ?? null,
        address: null,
        latitude: client.coordinates?.latitude ?? null,
        longitude: client.coordinates?.longitude ?? null,
        altitude: client.coordinates?.altitude ?? null,
        azimuth: null,
      })),
      ...cpes.map((cpe): MapLocation => ({
        id: cpe.id,
        kind: 'cpe',
        name: `${cpe.model} (${cpe.macAddress})`,
        parentName: clientsById.get(cpe.clientId)?.fullName ?? null,
        address: null,
        latitude: cpe.coordinates?.latitude ?? null,
        longitude: cpe.coordinates?.longitude ?? null,
        altitude: cpe.coordinates?.altitude ?? null,
        azimuth: cpe.azimuth ?? null,
      })),
    ];
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
