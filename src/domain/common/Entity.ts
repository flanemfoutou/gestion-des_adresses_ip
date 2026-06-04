export abstract class Entity<T> {
  readonly id: T;

  constructor(id: T) {
    if (!id) throw new Error('Entity id is required');
    this.id = id;
  }

  equals(other: Entity<T>): boolean {
    return this.id === other.id;
  }
}