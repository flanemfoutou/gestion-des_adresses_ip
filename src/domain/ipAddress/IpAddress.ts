import { Entity } from '@/domain/common/Entity';
import { IpAddressStatus, IpUsageType } from './IpAddressEnums';

const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

export class IpAddress extends Entity<string> {
  readonly address: string;
  readonly networkId: string;
  private _status: IpAddressStatus;
  private _usageType: IpUsageType;
  private _reserved: boolean;
  private _active: boolean;

  constructor(params: {
    id: string;
    address: string;
    status?: IpAddressStatus;
    usageType?: IpUsageType;
    reserved?: boolean;
    active?: boolean;
    networkId: string;
  }) {
    super(params.id);
    if (!IP_REGEX.test(params.address)) throw new Error('IpAddress is invalid (e.g. 192.168.1.10)');
    if (!params.networkId) throw new Error('IpAddress must reference a network');

    this.address = params.address;
    this._status =
      params.status ??
      (params.active === false
        ? 'decommissioned'
        : params.reserved
          ? 'reserved'
          : 'free');
    this._usageType = params.usageType ?? 'client';
    this._reserved = this._status === 'reserved';
    this._active = this._status !== 'decommissioned';
    this.networkId = params.networkId;
  }

  get status(): IpAddressStatus {
    return this._status;
  }

  get usageType(): IpUsageType {
    return this._usageType;
  }

  get reserved(): boolean {
    return this._reserved;
  }

  get active(): boolean {
    return this._active;
  }

  assign(): void {
    if (!this._active) throw new Error('Cannot assign an inactive IP address');
    if (this._reserved) throw new Error('Cannot assign a reserved IP address');
    if (this._status !== 'free') throw new Error(`Cannot assign IP — current status: ${this._status}`);
    this._status = 'occupied';
  }

  release(): void {
    if (this._status !== 'occupied') throw new Error(`Cannot release IP — current status: ${this._status}`);
    this._status = 'free';
  }

  reserve(usageType: IpUsageType = this._usageType): void {
    if (!this._active) throw new Error('Cannot reserve an inactive IP address');
    if (this._status !== 'free') throw new Error(`Cannot reserve IP — current status: ${this._status}`);
    this._reserved = true;
    this._usageType = usageType;
    this._status = 'reserved';
  }

  decommission(): void {
    if (this._status === 'occupied') throw new Error('Cannot decommission an occupied IP — release it first');
    this._reserved = false;
    this._active = false;
    this._status = 'decommissioned';
  }
}