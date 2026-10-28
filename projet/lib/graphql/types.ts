export type BaseStatus = "active" | "inactive" | "maintenance";
export type AccessPointStatus = "online" | "offline" | "maintenance";
export type IpStatus = "free" | "occupied" | "reserved" | "decommissioned";
export type IpUsageType = "client" | "management" | "infrastructure";
export type ClientType = "residential" | "business" | "enterprise" | "iot";

export type Coordinates = {
  latitude: number;
  longitude: number;
  altitude?: number | null;
};

export type MapEntityKind = "base" | "accessPoint" | "client" | "cpe";

export type MapLocationRecord = {
  id: string;
  kind: MapEntityKind;
  name: string;
  parentName?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  altitude?: number | null;
  azimuth?: number | null;
};

export type NearestAccessPointAtPosition = {
  accessPointId: string;
  accessPointName: string;
  baseName: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
};

export type BaseRecord = {
  id: string;
  name: string;
  location: string;
  status: BaseStatus;
  coordinates?: Coordinates | null;
};

export type AccessPointRecord = {
  id: string;
  name: string;
  managementIpId: string;
  baseId: string;
  sector: string;
  status: AccessPointStatus;
  azimuth?: number | null;
  coordinates?: Coordinates | null;
};

export type NetworkRecord = {
  id: string;
  cidr: string;
  gateway: string;
  vlan: number;
  accessPointId: string;
  networkAddress: string;
  totalHosts: number;
  isPrivate: boolean;
};

export type ClientRecord = {
  id: string;
  fullName: string;
  phoneNumber: string;
  clientType: ClientType;
  accessPointId: string;
  ipAddressId: string;
  coordinates?: Coordinates | null;
};

export type CpeRecord = {
  id: string;
  clientId: string;
  accessPointId: string;
  model: string;
  macAddress: string;
  coordinates?: Coordinates | null;
  azimuth?: number | null;
};

export type IpAddressRecord = {
  id: string;
  address: string;
  status: IpStatus;
  usageType: IpUsageType;
  reserved: boolean;
  active: boolean;
  networkId: string;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
};

export type GlobalIpStats = {
  totalNetworks: number;
  totalIps: number;
  totalUsedIps: number;
  totalFreeIps: number;
  totalReservedIps: number;
  utilizationPercentage: number;
  averageSubnetSize: number;
  privateNetworksCount: number;
  publicNetworksCount: number;
};

export type NetworkStats = {
  networkId: string;
  totalIps: number;
  freeIps: number;
  occupiedIps: number;
  reservedIps: number;
  decommissionedIps: number;
};

export type SubnetInfo = {
  cidr: string;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  usableStart: string;
  usableEnd: string;
  totalHosts: number;
  prefix: number;
  isPrivate: boolean;
};

export type DashboardQueryResult = {
  health: string;
  globalIpStats: GlobalIpStats;
  listBases: BaseRecord[];
};

export type BaseListQueryResult = { listBases: BaseRecord[] };
export type AccessPointListQueryResult = {
  listAccessPoints: AccessPointRecord[];
};
export type NetworkListQueryResult = { listNetworks: NetworkRecord[] };
export type NetworkStatsQueryResult = { networkStats: NetworkStats | null };
export type CalculateSubnetQueryResult = { calculateSubnet: SubnetInfo };
export type ClientSearchQueryResult = { searchClients: ClientRecord[] };
export type ClientListQueryResult = {
  listClients: PaginatedResult<ClientRecord>;
};
export type IpListQueryResult = {
  listIpAddressesByNetwork: PaginatedResult<IpAddressRecord>;
};
export type AvailableIpListQueryResult = {
  listAvailableIps: PaginatedResult<IpAddressRecord>;
};
export type HealthQueryResult = { health: string };
export type MapLocationsQueryResult = { listMapLocations: MapLocationRecord[] };
export type NearestAccessPointAtPositionQueryResult = {
  findNearestAccessPointAtPosition: NearestAccessPointAtPosition | null;
};

export type CreateBaseInput = {
  name: string;
  location: string;
  status: BaseStatus;
  coordinates?: Coordinates;
};

export type UpdateBaseInput = Partial<CreateBaseInput>;

export type UpdateAccessPointInput = {
  coordinates?: Coordinates;
};

export type CreateAccessPointInput = {
  name: string;
  managementIpId: string;
  baseId: string;
  sector: string;
  status: AccessPointStatus;
  coordinates?: Coordinates;
};

export type CreateNetworkInput = {
  cidr: string;
  gateway: string;
  vlan: number;
  accessPointId: string;
};

export type CreateClientInput = {
  fullName: string;
  phoneNumber: string;
  clientType: ClientType;
  accessPointId: string;
  ipAddressId: string;
  coordinates?: Coordinates;
};

export type UpdateClientInput = Partial<
  Pick<CreateClientInput, "fullName" | "phoneNumber" | "clientType">
>;

export type CreateIpAddressInput = {
  address: string;
  usageType: IpUsageType;
  reserved: boolean;
  active: boolean;
  networkId: string;
};

export type UpdateAccessPointStatusMutationResult = {
  updateAccessPointStatus: Pick<AccessPointRecord, "id" | "name" | "status">;
};
export type CreateAccessPointMutationResult = {
  createAccessPoint: AccessPointRecord;
};
export type CreateNetworkMutationResult = { createNetwork: NetworkRecord };
export type CreateClientMutationResult = { createClient: ClientRecord };
export type AssignIpMutationResult = {
  assignIp: {
    id: string;
    ipAddressId: string;
    clientId: string;
    accessPointId: string;
    status: "assigned" | "released" | "failed";
    assignedAt: string;
    releasedAt?: string | null;
  };
};
export type UpdateClientMutationResult = { updateClient: ClientRecord };
export type ChangeClientAccessPointMutationResult = {
  changeClientAccessPoint: Pick<
    ClientRecord,
    "id" | "fullName" | "accessPointId"
  >;
};
export type CreateIpAddressMutationResult = {
  createIpAddress: IpAddressRecord;
};
export type ReleaseIpMutationResult = { releaseIp: boolean };
export type ReserveIpMutationResult = { reserveIp: IpAddressRecord };
export type DecommissionIpMutationResult = { decommissionIp: IpAddressRecord };
export type DeleteBaseMutationResult = { deleteBase: BaseRecord };
export type DeleteNetworkMutationResult = { deleteNetwork: NetworkRecord };
export type DeleteClientMutationResult = { deleteClient: ClientRecord };
export type CreateBaseMutationResult = { createBase: BaseRecord };
export type UpdateBaseMutationResult = { updateBase: BaseRecord };

export type IdVariables = { id: string };
export type BaseIdVariables = { baseId: string };
export type AccessPointIdVariables = { accessPointId: string };
export type NetworkIdVariables = { networkId: string };
export type PaginatedVariables = { limit: number; offset: number };
export type SearchClientsVariables = {
  query: string;
  limit: number;
  offset: number;
};
export type ListClientsVariables = AccessPointIdVariables & PaginatedVariables;
export type NetworkIpListVariables = NetworkIdVariables & PaginatedVariables;
export type CalculateSubnetVariables = { cidr: string };
export type CreateBaseVariables = { input: CreateBaseInput };
export type UpdateBaseVariables = { id: string; input: UpdateBaseInput };
export type UpdateAccessPointVariables = {
  id: string;
  input: UpdateAccessPointInput;
};
export type UpdateClientLocationVariables = {
  clientId: string;
  coordinates: Coordinates;
};
export type UpdateCpeLocationVariables = {
  id: string;
  coordinates: Coordinates;
  azimuth?: number | null;
};
export type NearestAccessPointAtPositionVariables = {
  coordinates: Coordinates;
};
export type CreateAccessPointVariables = { input: CreateAccessPointInput };
export type UpdateAccessPointStatusVariables = {
  id: string;
  status: AccessPointStatus;
};
export type CreateNetworkVariables = { input: CreateNetworkInput };
export type CreateClientVariables = { input: CreateClientInput };
export type AssignIpVariables = {
  input: {
    clientId: string;
    accessPointId: string;
    networkId: string;
    ipAddressId?: string;
  };
};
export type UpdateClientVariables = { id: string; input: UpdateClientInput };
export type ChangeClientAccessPointVariables = {
  input: { clientId: string; newAccessPointId: string };
};
export type CreateIpAddressVariables = { input: CreateIpAddressInput };
export type ReleaseIpVariables = { ipAddressId: string };
export type ReserveIpVariables = {
  input: { ipAddressId: string; usageType: IpUsageType };
};
export type DecommissionIpVariables = { input: { ipAddressId: string } };
