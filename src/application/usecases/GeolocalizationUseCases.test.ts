import { describe, expect, test } from 'bun:test';
import { AccessPoint } from '@/domain/accessPoint/AccessPoint';
import { Base } from '@/domain/base/Base';
import type {
  AccessPointRepository,
  BaseRepository,
  ClientRepository,
} from '@/application/ports/repositories';
import { FindNearestAccessPointUseCase } from './GeolocalizationUseCases';

const clientRepository: ClientRepository = {
  findById: async () => null,
  findAll: async () => [],
  findByIpAddressId: async () => null,
  findByPhoneNumber: async () => null,
  findByAccessPointId: async () => [],
  search: async () => [],
  save: async () => {},
  delete: async () => null,
};

function createUseCase(accessPoints: AccessPoint[]) {
  const accessPointRepository: AccessPointRepository = {
    findById: async (id) => accessPoints.find((point) => point.id === id) ?? null,
    findAll: async () => accessPoints,
    findByManagementIpId: async () => null,
    findByBaseId: async () => accessPoints,
    save: async () => {},
  };
  const baseRepository: BaseRepository = {
    findById: async (id) =>
      new Base({
        id,
        name: id === 'base-near' ? 'Base proche' : 'Base distante',
        location: 'Emplacement renseigné',
      }),
    findByName: async () => null,
    findByNameAndLocation: async () => null,
    findAll: async () => [],
    save: async () => {},
    delete: async () => null,
  };

  return new FindNearestAccessPointUseCase(
    clientRepository,
    accessPointRepository,
    baseRepository,
  );
}

describe('FindNearestAccessPointUseCase.executeAtPosition', () => {
  test('selects the nearest AP and returns its distance in meters', async () => {
    const distant = new AccessPoint({
      id: 'ap-far',
      name: 'AP distant',
      managementIpId: 'management-ip',
      baseId: 'base-far',
      sector: 'A',
      latitude: 0,
      longitude: 1,
    });
    const nearest = new AccessPoint({
      id: 'ap-near',
      name: 'AP proche',
      managementIpId: 'management-ip-2',
      baseId: 'base-near',
      sector: 'B',
      latitude: 0,
      longitude: 0.2,
    });

    const result = await createUseCase([distant, nearest]).executeAtPosition({
      latitude: 0,
      longitude: 0,
    });

    expect(result.accessPointId).toBe('ap-near');
    expect(result.baseName).toBe('Base proche');
    expect(result.distanceMeters).toBeCloseTo(22239, 0);
  });

  test('reports when no AP has coordinates', async () => {
    const useCase = createUseCase([
      new AccessPoint({
        id: 'ap-without-location',
        name: 'AP sans position',
        managementIpId: 'management-ip',
        baseId: 'base-far',
        sector: 'A',
      }),
    ]);

    await expect(
      useCase.executeAtPosition({ latitude: 0, longitude: 0 }),
    ).rejects.toThrow('No access points with coordinates available');
  });
});
