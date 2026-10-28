export type BaseStatus = 'active' | 'inactive' | 'maintenance';
export type AccessPointStatus = 'online' | 'offline' | 'maintenance';
export type IpStatus = 'free' | 'occupied' | 'reserved' | 'decommissioned';
export type IpUsageType = 'client' | 'management' | 'infrastructure';
export type ClientType = 'residential' | 'business' | 'enterprise' | 'iot';

export type BaseRecord = { id: string; name: string; location: string; status: BaseStatus };
export type AccessPointRecord = { id: string; name: string; managementIpId: string; baseId: string; sector: string; status: AccessPointStatus; azimuth?: number | null };
export type NetworkRecord = { id: string; cidr: string; gateway: string; vlan: number; accessPointId: string; networkAddress: string; totalHosts: number; isPrivate: boolean };
export type ClientRecord = { id: string; fullName: string; phoneNumber: string; clientType: ClientType; accessPointId: string; ipAddressId: string };
export type IpAddressRecord = { id: string; address: string; status: IpStatus; usageType: IpUsageType; reserved: boolean; active: boolean; networkId: string };
