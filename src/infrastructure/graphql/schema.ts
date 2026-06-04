export const typeDefs = `
  enum BaseStatus { active inactive maintenance }
  enum AccessPointStatus { online offline maintenance }
  enum IpAddressStatus { free occupied reserved decommissioned }
  enum IpUsageType { client management infrastructure }
  enum ClientType { residential business enterprise iot }
  enum IpAssignmentStatus { assigned released failed }

  type Base { id: ID! name: String! location: String! status: BaseStatus! }
  type AccessPoint { id: ID! name: String! managementIpId: ID! baseId: ID! sector: String! status: AccessPointStatus! }
  type Network { id: ID! cidr: String! gateway: String! vlan: Int! accessPointId: ID! }
  type IpAddress { id: ID! address: String! status: IpAddressStatus! usageType: IpUsageType! reserved: Boolean! active: Boolean! networkId: ID! }
  type Client { id: ID! fullName: String! phoneNumber: String! clientType: ClientType! accessPointId: ID! ipAddressId: ID! }
  type IpAssignment { id: ID! ipAddressId: ID! clientId: ID! accessPointId: ID! status: IpAssignmentStatus! assignedAt: String! releasedAt: String }
  
  type NetworkStats {
    networkId: ID!
    totalIps: Int!
    freeIps: Int!
    occupiedIps: Int!
    reservedIps: Int!
    decommissionedIps: Int!
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

  input CreateBaseInput { name: String! location: String! status: BaseStatus! }
  input UpdateBaseInput { name: String location: String status: BaseStatus }
  input CreateAccessPointInput { name: String! managementIpId: ID! baseId: ID! sector: String! status: AccessPointStatus! }
  input UpdateAccessPointInput { name: String sector: String status: AccessPointStatus }
  input CreateNetworkInput { cidr: String! gateway: String! vlan: Int! accessPointId: ID! }
  input UpdateNetworkInput { cidr: String gateway: String vlan: Int }
  input CreateClientInput { fullName: String! phoneNumber: String! clientType: ClientType! accessPointId: ID! ipAddressId: ID! }
  input UpdateClientInput { fullName: String phoneNumber: String clientType: ClientType }
  input CreateIpAddressInput { address: String! usageType: IpUsageType! reserved: Boolean! active: Boolean! networkId: ID! }
  input AssignIpInput { clientId: ID! accessPointId: ID! networkId: ID! }
  input ReserveIpInput { ipAddressId: ID! usageType: IpUsageType! }
  input DecommissionIpInput { ipAddressId: ID! }
  input BulkAssignIpInput { clientIds: [ID!]! accessPointId: ID! networkId: ID! }
  input ChangeAccessPointInput { clientId: ID! newAccessPointId: ID! }

  type Query {
    # Health Check
    health: String!
    
    # Base Queries
    getBase(id: ID!): Base
    listBases: [Base!]!
    
    # AccessPoint Queries
    getAccessPoint(id: ID!): AccessPoint
    listAccessPoints(baseId: ID!): [AccessPoint!]!
    
    # Network Queries
    getNetwork(id: ID!): Network
    listNetworks(accessPointId: ID!): [Network!]!
    networkStats(networkId: ID!): NetworkStats
    
    # Client Queries
    getClient(id: ID!): Client
    listClients(accessPointId: ID!, limit: Int = 50, offset: Int = 0): PaginatedClientResponse!
    searchClients(query: String!, limit: Int = 20, offset: Int = 0): [Client!]!
    
    # IpAddress Queries
    getIpAddress(id: ID!): IpAddress
    listAvailableIps(networkId: ID!, limit: Int = 50, offset: Int = 0): PaginatedIpAddressResponse!
    listIpAddressesByStatus(status: IpAddressStatus!, limit: Int = 50, offset: Int = 0): PaginatedIpAddressResponse!
    listIpAddressesByNetwork(networkId: ID!, limit: Int = 50, offset: Int = 0): PaginatedIpAddressResponse!
    
    # Assignment History
    ipAssignmentHistory(ipAddressId: ID!): [IpAssignment!]!
  }

  type Mutation {
    # Base Mutations
    createBase(input: CreateBaseInput!): Base!
    updateBase(id: ID!, input: UpdateBaseInput!): Base!
    deleteBase(id: ID!): Boolean!
    
    # AccessPoint Mutations
    createAccessPoint(input: CreateAccessPointInput!): AccessPoint!
    updateAccessPoint(id: ID!, input: UpdateAccessPointInput!): AccessPoint!
    updateAccessPointStatus(id: ID!, status: AccessPointStatus!): AccessPoint!
    
    # Network Mutations
    createNetwork(input: CreateNetworkInput!): Network!
    updateNetwork(id: ID!, input: UpdateNetworkInput!): Network!
    deleteNetwork(id: ID!): Boolean!
    
    # Client Mutations
    createClient(input: CreateClientInput!): Client!
    updateClient(id: ID!, input: UpdateClientInput!): Client!
    deleteClient(id: ID!): Boolean!
    changeClientAccessPoint(input: ChangeAccessPointInput!): Client!
    
    # IpAddress Mutations
    createIpAddress(input: CreateIpAddressInput!): IpAddress!
    assignIp(input: AssignIpInput!): IpAssignment!
    releaseIp(ipAddressId: ID!): Boolean!
    reserveIp(input: ReserveIpInput!): IpAddress!
    decommissionIp(input: DecommissionIpInput!): IpAddress!
    bulkAssignIp(input: BulkAssignIpInput!): [IpAssignment!]!
  }
`;