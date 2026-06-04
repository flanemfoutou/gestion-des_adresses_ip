import { Entity } from '@/domain/common/Entity';
import { BaseStatus } from './BaseStatus';

export class Base extends Entity<string> {
  readonly name: string;
  readonly location: string;
  private _status: BaseStatus;

  constructor(params: {
    id: string;
    name: string;
    location: string;
    status?: BaseStatus;
  }) {
    super(params.id);
    if (!params.name.trim()) throw new Error('Base name is required');
    if (!params.location.trim()) throw new Error('Base location is required');

    this.name = params.name;
    this.location = params.location;
    this._status = params.status ?? 'active';
  }

  get status(): BaseStatus {
    return this._status;
  }

  activate(): void {
    if (this._status === 'active') throw new Error('Base is already active');
    this._status = 'active';
  }

  deactivate(): void {
    if (this._status === 'inactive') throw new Error('Base is already inactive');
    this._status = 'inactive';
  }

  setMaintenance(): void {
    if (this._status === 'maintenance') throw new Error('Base is already in maintenance');
    this._status = 'maintenance';
  }
}