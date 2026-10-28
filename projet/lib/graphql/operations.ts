import { gql } from "@apollo/client";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import type {
  AccessPointIdVariables,
  AccessPointListQueryResult,
  AssignIpMutationResult,
  AssignIpVariables,
  BaseIdVariables,
  BaseListQueryResult,
  AvailableIpListQueryResult,
  CalculateSubnetQueryResult,
  CalculateSubnetVariables,
  ChangeClientAccessPointMutationResult,
  ChangeClientAccessPointVariables,
  ClientListQueryResult,
  ClientSearchQueryResult,
  CreateAccessPointInput,
  CreateAccessPointMutationResult,
  CreateAccessPointVariables,
  CreateBaseMutationResult,
  CreateBaseVariables,
  CreateClientMutationResult,
  CreateClientVariables,
  CreateIpAddressMutationResult,
  CreateIpAddressVariables,
  CreateNetworkMutationResult,
  CreateNetworkVariables,
  CpeRecord,
  DashboardQueryResult,
  DecommissionIpMutationResult,
  DecommissionIpVariables,
  DeleteBaseMutationResult,
  DeleteClientMutationResult,
  DeleteNetworkMutationResult,
  HealthQueryResult,
  IdVariables,
  IpListQueryResult,
  MapLocationsQueryResult,
  NearestAccessPointAtPositionQueryResult,
  NearestAccessPointAtPositionVariables,
  ListClientsVariables,
  NetworkIdVariables,
  NetworkListQueryResult,
  NetworkIpListVariables,
  NetworkStatsQueryResult,
  ReleaseIpMutationResult,
  ReleaseIpVariables,
  ReserveIpMutationResult,
  ReserveIpVariables,
  SearchClientsVariables,
  UpdateAccessPointStatusMutationResult,
  UpdateAccessPointStatusVariables,
  UpdateAccessPointVariables,
  UpdateBaseMutationResult,
  UpdateBaseVariables,
  UpdateClientMutationResult,
  UpdateClientLocationVariables,
  UpdateClientVariables,
  UpdateCpeLocationVariables,
} from "./types";

function typedGql<TResult, TVariables>(
  source: string,
): TypedDocumentNode<TResult, TVariables> {
  return gql(source) as TypedDocumentNode<TResult, TVariables>;
}

export const HEALTH_QUERY = typedGql<HealthQueryResult, Record<string, never>>(`
  query HealthCheck {
    health
  }
`);

export const MAP_LOCATIONS_QUERY = typedGql<
  MapLocationsQueryResult,
  Record<string, never>
>(`
  query ListMapLocations {
    listMapLocations {
      id
      kind
      name
      parentName
      address
      latitude
      longitude
      altitude
      azimuth
    }
  }
`);

export const FIND_NEAREST_ACCESS_POINT_AT_POSITION_QUERY = typedGql<
  NearestAccessPointAtPositionQueryResult,
  NearestAccessPointAtPositionVariables
>(`
  query FindNearestAccessPointAtPosition($coordinates: CoordinatesInput!) {
    findNearestAccessPointAtPosition(coordinates: $coordinates) {
      accessPointId
      accessPointName
      baseName
      distanceMeters
      latitude
      longitude
    }
  }
`);

export const DASHBOARD_QUERY = typedGql<
  DashboardQueryResult,
  Record<string, never>
>(`
  query DashboardOverview {
    health
    globalIpStats {
      totalNetworks
      totalIps
      totalUsedIps
      totalFreeIps
      totalReservedIps
      utilizationPercentage
      averageSubnetSize
      privateNetworksCount
      publicNetworksCount
    }
    listBases {
      id
      name
      location
      status
    }
  }
`);

export const BASES_QUERY = typedGql<
  BaseListQueryResult,
  Record<string, never>
>(`
  query ListBases {
    listBases {
      id
      name
      location
      status
      coordinates {
        latitude
        longitude
        altitude
      }
    }
  }
`);

export const ACCESS_POINTS_QUERY = typedGql<
  AccessPointListQueryResult,
  BaseIdVariables
>(`
  query ListAccessPoints($baseId: ID!) {
    listAccessPoints(baseId: $baseId) {
      id
      name
      managementIpId
      baseId
      sector
      status
      azimuth
      tilt
      beamwidth
      coordinates {
        latitude
        longitude
        altitude
      }
    }
  }
`);

export const NETWORKS_QUERY = typedGql<
  NetworkListQueryResult,
  AccessPointIdVariables
>(`
  query ListNetworks($accessPointId: ID!) {
    listNetworks(accessPointId: $accessPointId) {
      id
      cidr
      gateway
      vlan
      accessPointId
      networkAddress
      broadcastAddress
      subnetMask
      usableStart
      usableEnd
      totalHosts
      prefix
      isPrivate
    }
  }
`);

export const NETWORK_STATS_QUERY = typedGql<
  NetworkStatsQueryResult,
  NetworkIdVariables
>(`
  query NetworkStats($networkId: ID!) {
    networkStats(networkId: $networkId) {
      networkId
      totalIps
      freeIps
      occupiedIps
      reservedIps
      decommissionedIps
    }
  }
`);

export const CALCULATE_SUBNET_QUERY = typedGql<
  CalculateSubnetQueryResult,
  CalculateSubnetVariables
>(`
  query CalculateSubnet($cidr: String!) {
    calculateSubnet(cidr: $cidr) {
      cidr
      networkAddress
      broadcastAddress
      subnetMask
      usableStart
      usableEnd
      totalHosts
      prefix
      isPrivate
    }
  }
`);

export const CLIENT_SEARCH_QUERY = typedGql<
  ClientSearchQueryResult,
  SearchClientsVariables
>(`
  query SearchClients($query: String!, $limit: Int = 30, $offset: Int = 0) {
    searchClients(query: $query, limit: $limit, offset: $offset) {
      id
      fullName
      phoneNumber
      clientType
      accessPointId
      ipAddressId
      coordinates {
        latitude
        longitude
        altitude
      }
    }
  }
`);

export const CLIENTS_BY_ACCESS_POINT_QUERY = typedGql<
  ClientListQueryResult,
  ListClientsVariables
>(`
  query ListClients($accessPointId: ID!, $limit: Int = 50, $offset: Int = 0) {
    listClients(accessPointId: $accessPointId, limit: $limit, offset: $offset) {
      data {
        id
        fullName
        phoneNumber
        clientType
        accessPointId
        ipAddressId
        coordinates {
          latitude
          longitude
          altitude
        }
      }
      total
      limit
      offset
    }
  }
`);

export const IPS_BY_NETWORK_QUERY = typedGql<
  IpListQueryResult,
  NetworkIpListVariables
>(`
  query ListIpAddressesByNetwork($networkId: ID!, $limit: Int = 100, $offset: Int = 0) {
    listIpAddressesByNetwork(networkId: $networkId, limit: $limit, offset: $offset) {
      data {
        id
        address
        status
        usageType
        reserved
        active
        networkId
      }
      total
      limit
      offset
    }
  }
`);

export const AVAILABLE_IPS_QUERY = typedGql<
  AvailableIpListQueryResult,
  NetworkIpListVariables
>(`
  query ListAvailableIps($networkId: ID!, $limit: Int = 100, $offset: Int = 0) {
    listAvailableIps(networkId: $networkId, limit: $limit, offset: $offset) {
      data {
        id
        address
        status
        usageType
        reserved
        active
        networkId
      }
      total
      limit
      offset
    }
  }
`);

export const CREATE_BASE_MUTATION = typedGql<
  CreateBaseMutationResult,
  CreateBaseVariables
>(`
  mutation CreateBase($input: CreateBaseInput!) {
    createBase(input: $input) {
      id
      name
      location
      status
    }
  }
`);

export const UPDATE_BASE_MUTATION = typedGql<
  UpdateBaseMutationResult,
  UpdateBaseVariables
>(`
  mutation UpdateBase($id: ID!, $input: UpdateBaseInput!) {
    updateBase(id: $id, input: $input) {
      id
      name
      location
      status
    }
  }
`);

export const UPDATE_ACCESS_POINT_MUTATION = typedGql<
  { updateAccessPoint: import("./types").AccessPointRecord },
  UpdateAccessPointVariables
>(`
  mutation UpdateAccessPointCoordinates($id: ID!, $input: UpdateAccessPointInput!) {
    updateAccessPoint(id: $id, input: $input) {
      id
      name
      baseId
      managementIpId
      sector
      status
      coordinates {
        latitude
        longitude
        altitude
      }
    }
  }
`);

export const DELETE_BASE_MUTATION = typedGql<
  DeleteBaseMutationResult,
  IdVariables
>(`
  mutation DeleteBase($id: ID!) {
    deleteBase(id: $id) {
      id
      name
      location
      status
    }
  }
`);

export const CREATE_ACCESS_POINT_MUTATION = typedGql<
  CreateAccessPointMutationResult,
  CreateAccessPointVariables
>(`
  mutation CreateAccessPoint($input: CreateAccessPointInput!) {
    createAccessPoint(input: $input) {
      id
      name
      baseId
      managementIpId
      sector
      status
      azimuth
    }
  }
`);

export const UPDATE_ACCESS_POINT_STATUS_MUTATION = typedGql<
  UpdateAccessPointStatusMutationResult,
  UpdateAccessPointStatusVariables
>(`
  mutation UpdateAccessPointStatus($id: ID!, $status: AccessPointStatus!) {
    updateAccessPointStatus(id: $id, status: $status) {
      id
      name
      status
    }
  }
`);

export const CREATE_NETWORK_MUTATION = typedGql<
  CreateNetworkMutationResult,
  CreateNetworkVariables
>(`
  mutation CreateNetwork($input: CreateNetworkInput!) {
    createNetwork(input: $input) {
      id
      cidr
      gateway
      vlan
      accessPointId
      totalHosts
      isPrivate
    }
  }
`);

export const DELETE_NETWORK_MUTATION = typedGql<
  DeleteNetworkMutationResult,
  IdVariables
>(`
  mutation DeleteNetwork($id: ID!) {
    deleteNetwork(id: $id) {
      id
      cidr
      gateway
      vlan
    }
  }
`);

export const CREATE_CLIENT_MUTATION = typedGql<
  CreateClientMutationResult,
  CreateClientVariables
>(`
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      id
      fullName
      phoneNumber
      clientType
      accessPointId
      ipAddressId
    }
  }
`);

export const ASSIGN_IP_MUTATION = typedGql<
  AssignIpMutationResult,
  AssignIpVariables
>(`
  mutation AssignIp($input: AssignIpInput!) {
    assignIp(input: $input) {
      id
      ipAddressId
      clientId
      accessPointId
      status
      assignedAt
      releasedAt
    }
  }
`);

export const UPDATE_CLIENT_MUTATION = typedGql<
  UpdateClientMutationResult,
  UpdateClientVariables
>(`
  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {
    updateClient(id: $id, input: $input) {
      id
      fullName
      phoneNumber
      clientType
      accessPointId
      ipAddressId
    }
  }
`);

export const UPDATE_CLIENT_LOCATION_MUTATION = typedGql<
  { updateClientLocation: import("./types").ClientRecord },
  UpdateClientLocationVariables
>(`
  mutation UpdateClientLocation($clientId: ID!, $coordinates: CoordinatesInput!) {
    updateClientLocation(clientId: $clientId, coordinates: $coordinates) {
      id
      fullName
      accessPointId
      ipAddressId
      coordinates {
        latitude
        longitude
        altitude
      }
    }
  }
`);

export const UPDATE_CPE_LOCATION_MUTATION = typedGql<
  { updateCpeLocation: CpeRecord },
  UpdateCpeLocationVariables
>(`
  mutation UpdateCpeLocation($id: ID!, $coordinates: CoordinatesInput!, $azimuth: Float) {
    updateCpeLocation(id: $id, coordinates: $coordinates, azimuth: $azimuth) {
      id
      clientId
      accessPointId
      model
      macAddress
      coordinates {
        latitude
        longitude
        altitude
      }
      azimuth
    }
  }
`);

export const DELETE_CLIENT_MUTATION = typedGql<
  DeleteClientMutationResult,
  IdVariables
>(`
  mutation DeleteClient($id: ID!) {
    deleteClient(id: $id) {
      id
      fullName
      phoneNumber
      clientType
      accessPointId
      ipAddressId
    }
  }
`);

export const CHANGE_CLIENT_ACCESS_POINT_MUTATION = typedGql<
  ChangeClientAccessPointMutationResult,
  ChangeClientAccessPointVariables
>(`
  mutation ChangeClientAccessPoint($input: ChangeAccessPointInput!) {
    changeClientAccessPoint(input: $input) {
      id
      fullName
      accessPointId
    }
  }
`);

export const CREATE_IP_ADDRESS_MUTATION = typedGql<
  CreateIpAddressMutationResult,
  CreateIpAddressVariables
>(`
  mutation CreateIpAddress($input: CreateIpAddressInput!) {
    createIpAddress(input: $input) {
      id
      address
      status
      usageType
      reserved
      active
      networkId
    }
  }
`);

export const RELEASE_IP_MUTATION = typedGql<
  ReleaseIpMutationResult,
  ReleaseIpVariables
>(`
  mutation ReleaseIp($ipAddressId: ID!) {
    releaseIp(ipAddressId: $ipAddressId)
  }
`);

export const RESERVE_IP_MUTATION = typedGql<
  ReserveIpMutationResult,
  ReserveIpVariables
>(`
  mutation ReserveIp($input: ReserveIpInput!) {
    reserveIp(input: $input) {
      id
      address
      status
      usageType
      reserved
      active
      networkId
    }
  }
`);

export const DECOMMISSION_IP_MUTATION = typedGql<
  DecommissionIpMutationResult,
  DecommissionIpVariables
>(`
  mutation DecommissionIp($input: DecommissionIpInput!) {
    decommissionIp(input: $input) {
      id
      address
      status
      usageType
      reserved
      active
      networkId
    }
  }
`);
