import { describe, expect, test } from 'bun:test';
import { DistanceCalculatorService } from './DistanceCalculatorService';

describe('DistanceCalculatorService', () => {
  test('calculates the distance between two coordinates in kilometers', () => {
    expect(
      DistanceCalculatorService.calculateDistance(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
      ),
    ).toBeCloseTo(111.195, 2);
  });

  test('clamps floating-point error for antipodal coordinates', () => {
    expect(
      DistanceCalculatorService.calculateDistance(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 180 },
      ),
    ).toBeCloseTo(20015.087, 2);
  });
});
