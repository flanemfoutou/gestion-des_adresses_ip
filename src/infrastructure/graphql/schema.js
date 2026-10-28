export const typeDefs = `
  enum BaseStatus { active inactive maintenance }
  enum AccessPointStatus { online offline maintenance }
  enum IpAddressStatus { free occupied reserved decommissioned }
  enum IpUsageType { client management infrastructure }
  enum ClientType { residential business enterprise iot }
  enum IpAssignmentStatus { assigned released failed }
  enum SignalQuality { excellent good fair poor critical }

  type Coordinates {
    latitude: Float!
    longitude: Float!
    altitude: Float
  }

  type Base {
    id: ID!
    name: String!
    location: String!
    status: BaseStatus!
    coordinates: Coordinates
  }

  type AccessPoint {
    id: ID!
    name: String!
    managementIpId: ID!
    baseId: ID!
    sector: String!
    status: AccessPointStatus!
    coordinates: Coordinates
    azimuth: Float
    tilt: Float
    beamwidth: Float
  }

  type Network {
    id: ID!
    cidr: String!
    gateway: String!
    vlan: Int!
    accessPointId: ID!
    networkAddress: String!
    broadcastAddress: String!
    subnetMask: String!
    wildcardMask: String!
    usableStart: String!
    usableEnd: String!
    totalHosts: Int!
    prefix: Int!
    isPrivate: Boolean!
  }

  type IpAddress {
    id: ID!
    address: String!
    status: IpAddressStatus!
    usageType: IpUsageType!
    reserved: Boolean!
    active: Boolean!
    networkId: ID!
  }

  type Client {
    id: ID!
    fullName: String!
    phoneNumber: String!
    clientType: ClientType!
    accessPointId: ID!
    ipAddressId: ID!
    coordinates: Coordinates
  }

  type ClientWithDistance {
    clientId: ID!
    clientName: String!
    distance: Float!
    latitude: Float
    longitude: Float
  }

  type NearestAccessPoint {
    accessPointId: ID!
    accessPointName: String!
    baseName: String!
    distance: Float!
    latitude: Float
    longitude: Float
  }

  type ClientGeolocationStatus {
    clientId: ID!
    clientName: String!
    phoneNumber: String!
    hasCoordinates: Boolean!
  }

  type IpAssignment {
    id: ID!
    ipAddressId: ID!
    clientId: ID!
    accessPointId: ID!
    status: IpAssignmentStatus!
    assignedAt: String!
    releasedAt: String
  }

  type CpeDevice {
    id: ID!
    clientId: ID!
    accessPointId: ID!
    model: String!
    macAddress: String!
    coordinates: Coordinates
    azimuth: Float
  }

  type SignalEvaluation {
    quality: SignalQuality!
    needsRealignment: Boolean!
    recommendation: String!
  }

  type SignalMetric {
    id: ID!
    cpeId: ID!
    accessPointId: ID!
    rssi: Float!
    snr: Float
    txPower: Float
    rxPower: Float
    linkQuality: Float
    quality: SignalQuality!
    distance: Float
    evaluation: SignalEvaluation!
    measuredAt: String!
  }

  type FieldReport {
    cpe: CpeDevice!
    accessPoint: AccessPoint!
    latestSignal: SignalMetric!
    evaluation: SignalEvaluation!
    distanceMeters: Float
    signalHistory: [SignalMetric!]!
  }

  type NetworkStats {
    networkId: ID!
    totalIps: Int!
    freeIps: Int!
    occupiedIps: Int!
    reservedIps: Int!
    decommissionedIps: Int!
  }

  type SubnetInfo {
    cidr: String!
    networkAddress: String!
    broadcastAddress: String!
    subnetMask: String!
    wildcardMask: String!
    usableStart: String!
    usableEnd: String!
    totalHosts: Int!
    prefix: Int!
    isPrivate: Boolean!
  }

  type GlobalIpStats {
    totalNetworks: Int!
    totalIps: Int!
    totalUsedIps: Int!
    totalFreeIps: Int!
    totalReservedIps: Int!
    utilizationPercentage: Float!
    averageSubnetSize: Float!
    privateNetworksCount: Int!
    publicNetworksCount: Int!
  }

  type PaginatedClientResponse {
    data: [Client!]!
    total: Int!
    limit: Int!
    offset: Int!
  }

  type PaginatedIpAddressResponse {
    data: [IpAddress!]!
    total: Int!
    limit: Int!
    offset: Int!
  }

  input CoordinatesInput {
    latitude: Float!
    longitude: Float!
    altitude: Float
  }

  input CreateBaseInput {
    name: String!
    location: String!
    status: BaseStatus!
    coordinates: CoordinatesInput
  }

  input UpdateBaseInput {
    name: String
    location: String
    status: BaseStatus
    coordinates: CoordinatesInput
  }

  input CreateAccessPointInput {
    name: String!
    managementIpId: ID!
    baseId: ID!
    sector: String!
    status: AccessPointStatus!
    coordinates: CoordinatesInput
    azimuth: Float
    tilt: Float
    beamwidth: Float
  }

  input UpdateAccessPointInput {
    name: String
    sector: String
    status: AccessPointStatus
    coordinates: CoordinatesInput
    azimuth: Float
    tilt: Float
    beamwidth: Float
  }

  input CreateNetworkInput {
    cidr: String!
    gateway: String!
    vlan: Int!
    accessPointId: ID!
  }

  input UpdateNetworkInput {
    cidr: String
    gateway: String
    vlan: Int
  }

  input CreateClientInput {
    fullName: String!
    phoneNumber: String!
    clientType: ClientType!
    accessPointId: ID!
    ipAddressId: ID!
    coordinates: CoordinatesInput
  }

  input UpdateClientInput {
    fullName: String
    phoneNumber: String
    clientType: ClientType
    coordinates: CoordinatesInput
  }

  input CreateIpAddressInput {
    address: String!
    usageType: IpUsageType!
    reserved: Boolean!
    active: Boolean!
    networkId: ID!
  }

  input AssignIpInput {
    clientId: ID!
    accessPointId: ID!
    networkId: ID!
  }

  input ReserveIpInput {
    ipAddressId: ID!
    usageType: IpUsageType!
  }

  input DecommissionIpInput {
    ipAddressId: ID!
  }

  input BulkAssignIpInput {
    clientIds: [ID!]!
    accessPointId: ID!
    networkId: ID!
  }

  input ChangeAccessPointInput {
    clientId: ID!
    newAccessPointId: ID!
  }

  input RecordSignalInput {
    cpeId: ID!
    accessPointId: ID!
    rssi: Float!
    snr: Float
    txPower: Float
    rxPower: Float
    linkQuality: Float
  }

  input CreateCpeInput {
    clientId: ID!
    accessPointId: ID!
    model: String!
    macAddress: String!
    coordinates: CoordinatesInput
    azimuth: Float
  }

  type Query {
    health: String!

    getBase(id: ID!): Base
    listBases: [Base!]!

    getAccessPoint(id: ID!): AccessPoint
    listAccessPoints(baseId: ID!): [AccessPoint!]!

    getNetwork(id: ID!): Network
    listNetworks(accessPointId: ID!): [Network!]!
    networkStats(networkId: ID!): NetworkStats

    calculateSubnet(cidr: String!): SubnetInfo!
    isIpInNetwork(ip: String!, networkId: ID!): Boolean!
    suggestNextNetwork(baseNetworkId: ID!, prefix: Int!): String!
    splitNetwork(networkId: ID!, newPrefix: Int!): [SubnetInfo!]!
    globalIpStats: GlobalIpStats!

    getClient(id: ID!): Client
    listClients(accessPointId: ID!, limit: Int = 50, offset: Int = 0): PaginatedClientResponse!
    searchClients(query: String!, limit: Int = 20, offset: Int = 0): [Client!]!

    getIpAddress(id: ID!): IpAddress
    listAvailableIps(networkId: ID!, limit: Int = 50, offset: Int = 0): PaginatedIpAddressResponse!
    listIpAddressesByStatus(status: IpAddressStatus!, limit: Int = 50, offset: Int = 0): PaginatedIpAddressResponse!
    listIpAddressesByNetwork(networkId: ID!, limit: Int = 50, offset: Int = 0): PaginatedIpAddressResponse!

    getFieldReport(cpeId: ID!): FieldReport!
    listCpesNeedingRealignment(accessPointId: ID): [FieldReport!]!
    getSignalHistory(cpeId: ID!, limit: Int = 20): [SignalMetric!]!
    getCurrentSignal(cpeId: ID!): SignalMetric

    ipAssignmentHistory(ipAddressId: ID!): [IpAssignment!]!

    findClientsNearAccessPoint(accessPointId: ID!, maxDistance: Int = 100): [ClientWithDistance!]!
    findNearestAccessPoint(clientId: ID!): NearestAccessPoint!
    listClientsNeedingGeolocation: [ClientGeolocationStatus!]!
  }

  type Mutation {
    createBase(input: CreateBaseInput!): Base!
    updateBase(id: ID!, input: UpdateBaseInput!): Base!
    deleteBase(id: ID!): Base!

    createAccessPoint(input: CreateAccessPointInput!): AccessPoint!
    updateAccessPoint(id: ID!, input: UpdateAccessPointInput!): AccessPoint!
    updateAccessPointStatus(id: ID!, status: AccessPointStatus!): AccessPoint!

    createNetwork(input: CreateNetworkInput!): Network!
    updateNetwork(id: ID!, input: UpdateNetworkInput!): Network!
    deleteNetwork(id: ID!): Network!

    createClient(input: CreateClientInput!): Client!
    updateClient(id: ID!, input: UpdateClientInput!): Client!
    updateClientLocation(clientId: ID!, coordinates: CoordinatesInput!): Client!
    deleteClient(id: ID!): Client!
    changeClientAccessPoint(input: ChangeAccessPointInput!): Client!

    createIpAddress(input: CreateIpAddressInput!): IpAddress!
    assignIp(input: AssignIpInput!): IpAssignment!
    releaseIp(ipAddressId: ID!): Boolean!
    reserveIp(input: ReserveIpInput!): IpAddress!
    decommissionIp(input: DecommissionIpInput!): IpAddress!
    bulkAssignIp(input: BulkAssignIpInput!): [IpAssignment!]!

    createCpeDevice(input: CreateCpeInput!): CpeDevice!
    updateCpeLocation(id: ID!, coordinates: CoordinatesInput!, azimuth: Float): CpeDevice!
    recordSignalMetric(input: RecordSignalInput!): SignalMetric!
  }
`;
