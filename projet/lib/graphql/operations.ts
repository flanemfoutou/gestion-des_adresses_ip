import { gql } from '@apollo/client';

export const DASHBOARD_QUERY = gql`
  query DashboardOverview {
    health
    globalIpStats {
      totalNetworks totalIps totalUsedIps totalFreeIps totalReservedIps
      utilizationPercentage averageSubnetSize privateNetworksCount publicNetworksCount
    }
    listBases { id name location status }
  }
`;

export const BASES_QUERY = gql`
  query ListBases { listBases { id name location status coordinates { latitude longitude altitude } } }
`;

export const ACCESS_POINTS_QUERY = gql`
  query ListAccessPoints($baseId: ID!) {
    listAccessPoints(baseId: $baseId) { id name managementIpId baseId sector status azimuth tilt beamwidth coordinates { latitude longitude altitude } }
  }
`;

export const NETWORKS_QUERY = gql`
  query ListNetworks($accessPointId: ID!) {
    listNetworks(accessPointId: $accessPointId) { id cidr gateway vlan accessPointId networkAddress broadcastAddress subnetMask usableStart usableEnd totalHosts prefix isPrivate }
  }
`;

export const NETWORK_STATS_QUERY = gql`
  query NetworkStats($networkId: ID!) {
    networkStats(networkId: $networkId) { networkId totalIps freeIps occupiedIps reservedIps decommissionedIps }
  }
`;

export const CALCULATE_SUBNET_QUERY = gql`
  query CalculateSubnet($cidr: String!) {
    calculateSubnet(cidr: $cidr) { cidr networkAddress broadcastAddress subnetMask usableStart usableEnd totalHosts prefix isPrivate }
  }
`;

export const CLIENT_SEARCH_QUERY = gql`
  query SearchClients($query: String!, $limit: Int = 30, $offset: Int = 0) {
    searchClients(query: $query, limit: $limit, offset: $offset) { id fullName phoneNumber clientType accessPointId ipAddressId coordinates { latitude longitude altitude } }
  }
`;

export const CLIENTS_BY_ACCESS_POINT_QUERY = gql`
  query ListClients($accessPointId: ID!, $limit: Int = 50, $offset: Int = 0) {
    listClients(accessPointId: $accessPointId, limit: $limit, offset: $offset) {
      data { id fullName phoneNumber clientType accessPointId ipAddressId coordinates { latitude longitude altitude } }
      total limit offset
    }
  }
`;

export const IPS_BY_NETWORK_QUERY = gql`
  query ListIpAddressesByNetwork($networkId: ID!, $limit: Int = 100, $offset: Int = 0) {
    listIpAddressesByNetwork(networkId: $networkId, limit: $limit, offset: $offset) {
      data { id address status usageType reserved active networkId }
      total limit offset
    }
  }
`;

export const AVAILABLE_IPS_QUERY = gql`
  query ListAvailableIps($networkId: ID!, $limit: Int = 100, $offset: Int = 0) {
    listAvailableIps(networkId: $networkId, limit: $limit, offset: $offset) {
      data { id address status usageType reserved active networkId }
      total limit offset
    }
  }
`;

export const GEOLOCATION_QUERY = gql`
  query GeolocationOverview {
    listClientsNeedingGeolocation { clientId clientName phoneNumber hasCoordinates }
    listCpesNeedingRealignment { cpe { id model macAddress clientId accessPointId } accessPoint { id name sector status } latestSignal { rssi snr quality measuredAt evaluation { needsRealignment recommendation } } evaluation { needsRealignment recommendation } distanceMeters }
  }
`;

export const CREATE_BASE_MUTATION = gql`
  mutation CreateBase($input: CreateBaseInput!) { createBase(input: $input) { id name location status } }
`;

export const UPDATE_BASE_MUTATION = gql`
  mutation UpdateBase($id: ID!, $input: UpdateBaseInput!) { updateBase(id: $id, input: $input) { id name location status } }
`;

export const DELETE_BASE_MUTATION = gql`
  mutation DeleteBase($id: ID!) { deleteBase(id: $id) { id name location status } }
`;

export const CREATE_ACCESS_POINT_MUTATION = gql`
  mutation CreateAccessPoint($input: CreateAccessPointInput!) { createAccessPoint(input: $input) { id name baseId managementIpId sector status } }
`;

export const UPDATE_ACCESS_POINT_STATUS_MUTATION = gql`
  mutation UpdateAccessPointStatus($id: ID!, $status: AccessPointStatus!) { updateAccessPointStatus(id: $id, status: $status) { id name status } }
`;

export const CREATE_NETWORK_MUTATION = gql`
  mutation CreateNetwork($input: CreateNetworkInput!) { createNetwork(input: $input) { id cidr gateway vlan accessPointId totalHosts isPrivate } }
`;

export const DELETE_NETWORK_MUTATION = gql`
  mutation DeleteNetwork($id: ID!) { deleteNetwork(id: $id) { id cidr gateway vlan } }
`;

export const CREATE_CLIENT_MUTATION = gql`
  mutation CreateClient($input: CreateClientInput!) { createClient(input: $input) { id fullName phoneNumber clientType accessPointId ipAddressId } }
`;

export const UPDATE_CLIENT_MUTATION = gql`
  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) { updateClient(id: $id, input: $input) { id fullName phoneNumber clientType accessPointId ipAddressId } }
`;

export const DELETE_CLIENT_MUTATION = gql`
  mutation DeleteClient($id: ID!) { deleteClient(id: $id) { id fullName phoneNumber clientType accessPointId ipAddressId } }
`;

export const CHANGE_CLIENT_ACCESS_POINT_MUTATION = gql`
  mutation ChangeClientAccessPoint($input: ChangeAccessPointInput!) { changeClientAccessPoint(input: $input) { id fullName accessPointId } }
`;

export const CREATE_IP_ADDRESS_MUTATION = gql`
  mutation CreateIpAddress($input: CreateIpAddressInput!) { createIpAddress(input: $input) { id address status usageType reserved active networkId } }
`;

export const ASSIGN_IP_MUTATION = gql`
  mutation AssignIp($input: AssignIpInput!) { assignIp(input: $input) { id ipAddressId clientId accessPointId status assignedAt } }
`;

export const RELEASE_IP_MUTATION = gql`
  mutation ReleaseIp($ipAddressId: ID!) { releaseIp(ipAddressId: $ipAddressId) }
`;

export const RESERVE_IP_MUTATION = gql`
  mutation ReserveIp($input: ReserveIpInput!) { reserveIp(input: $input) { id address status usageType reserved active networkId } }
`;

export const DECOMMISSION_IP_MUTATION = gql`
  mutation DecommissionIp($input: DecommissionIpInput!) { decommissionIp(input: $input) { id address status usageType reserved active networkId } }
`;

export const CREATE_CPE_MUTATION = gql`
  mutation CreateCpeDevice($input: CreateCpeInput!) { createCpeDevice(input: $input) { id model macAddress clientId accessPointId azimuth } }
`;

export const RECORD_SIGNAL_METRIC_MUTATION = gql`
  mutation RecordSignalMetric($input: RecordSignalInput!) {
    recordSignalMetric(input: $input) { id cpeId accessPointId rssi snr linkQuality quality measuredAt evaluation { quality needsRealignment recommendation } }
  }
`;
