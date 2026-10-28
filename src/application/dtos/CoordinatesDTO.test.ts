import { describe, expect, test } from 'bun:test';
import { CoordinatesSchema } from './CoordinatesDTO';

describe('CoordinatesSchema', () => {
  test('accepts inclusive geographic bounds', () => {
    expect(
      CoordinatesSchema.safeParse({ latitude: -90, longitude: 180 }).success,
    ).toBe(true);
  });

  test.each([
    { latitude: -90.01, longitude: 0 },
    { latitude: 90.01, longitude: 0 },
    { latitude: 0, longitude: -180.01 },
    { latitude: 0, longitude: 180.01 },
    { latitude: Number.NaN, longitude: 0 },
    { latitude: 0, longitude: Number.POSITIVE_INFINITY },
  ])('rejects invalid coordinates: $latitude, $longitude', (coordinates) => {
    expect(CoordinatesSchema.safeParse(coordinates).success).toBe(false);
  });
});
