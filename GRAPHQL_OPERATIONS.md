# 📋 API GraphQL - 6 Domaines & 60 Opérations

## 🏗️ Vue d'ensemble

| Domaine | Queries | Mutations | Total |
|---------|---------|-----------|-------|
| **1. Base / AccessPoint / Network** | 7 | 6 | **13** |
| **2. Client** | 4 | 4 | **8** |
| **3. IpAddress / IpAssignment** | 8 | 7 | **15** |
| **4. Géolocalisation / CPE** | 5 | 5 | **10** |
| **5. Signal / Alignement** | 4 | 4 | **8** |
| **6. Calcul IP / Sous-réseau** | 4 | 4 | **8** |
| **7. Audit** | 1 | 0 | **1** |
| | **33 Queries** | **30 Mutations** | **63** |

---

## 🌐 Domaine 1 : Base / AccessPoint / Network (13 opérations)

**Gestion des sites et infrastructure réseau**

### 📖 Queries (7)

```graphql
# Récupérer une base par ID
query GetBase($id: ID!) {
  getBase(id: $id) {
    id
    name
    location
    status
    coordinates { latitude, longitude, altitude }
  }
}

# Lister toutes les bases
query ListBases {
  listBases {
    id
    name
    location
    status
    coordinates { latitude, longitude, altitude }
  }
}

# Récupérer un point d'accès par ID
query GetAccessPoint($id: ID!) {
  getAccessPoint(id: $id) {
    id
    name
    managementIpId
    baseId
    sector
    status
    coordinates { latitude, longitude, altitude }
    azimuth
    tilt
    beamwidth
  }
}

# Lister les points d'accès d'une base
query ListAccessPoints($baseId: ID!) {
  listAccessPoints(baseId: $baseId) {
    id
    name
    sector
    status
    coordinates { latitude, longitude, altitude }
  }
}

# Récupérer un réseau par ID
query GetNetwork($id: ID!) {
  getNetwork(id: $id) {
    id
    cidr
    gateway
    vlan
    accessPointId
    networkAddress
    broadcastAddress
    subnetMask
    wildcardMask
    usableStart
    usableEnd
    totalHosts
    prefix
    isPrivate
  }
}

# Lister les réseaux d'un point d'accès
query ListNetworks($accessPointId: ID!) {
  listNetworks(accessPointId: $accessPointId) {
    id
    cidr
    gateway
    vlan
    totalHosts
    isPrivate
  }
}

# Récupérer les statistiques d'un réseau
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
```

### ✏️ Mutations (6)

```graphql
# Créer une nouvelle base
mutation CreateBase($input: CreateBaseInput!) {
  createBase(input: $input) {
    id
    name
    location
    status
    coordinates { latitude, longitude, altitude }
  }
}

# Mettre à jour une base
mutation UpdateBase($id: ID!, $input: UpdateBaseInput!) {
  updateBase(id: $id, input: $input) {
    id
    name
    location
    status
    coordinates { latitude, longitude, altitude }
  }
}

# Supprimer une base
mutation DeleteBase($id: ID!) {
  deleteBase(id: $id)
}

# Créer un point d'accès
mutation CreateAccessPoint($input: CreateAccessPointInput!) {
  createAccessPoint(input: $input) {
    id
    name
    sector
    status
    coordinates { latitude, longitude, altitude }
  }
}

# Mettre à jour un point d'accès
mutation UpdateAccessPoint($id: ID!, $input: UpdateAccessPointInput!) {
  updateAccessPoint(id: $id, input: $input) {
    id
    name
    sector
    status
  }
}

# Changer le statut d'un point d'accès
mutation UpdateAccessPointStatus($id: ID!, $status: AccessPointStatus!) {
  updateAccessPointStatus(id: $id, status: $status) {
    id
    status
  }
}

# Créer un réseau
mutation CreateNetwork($input: CreateNetworkInput!) {
  createNetwork(input: $input) {
    id
    cidr
    gateway
    vlan
    networkAddress
    subnetMask
    totalHosts
    isPrivate
  }
}

# Mettre à jour un réseau
mutation UpdateNetwork($id: ID!, $input: UpdateNetworkInput!) {
  updateNetwork(id: $id, input: $input) {
    id
    cidr
    gateway
    vlan
  }
}

# Supprimer un réseau
mutation DeleteNetwork($id: ID!) {
  deleteNetwork(id: $id)
}
```

---

## 👥 Domaine 2 : Client (8 opérations)

**Gestion des abonnés avec recherche et déplacement entre points d'accès**

### 📖 Queries (4)

```graphql
# Récupérer un client par ID
query GetClient($id: ID!) {
  getClient(id: $id) {
    id
    fullName
    phoneNumber
    clientType
    accessPointId
    ipAddressId
  }
}

# Lister les clients d'un point d'accès (paginé)
query ListClients($accessPointId: ID!, $limit: Int, $offset: Int) {
  listClients(accessPointId: $accessPointId, limit: $limit, offset: $offset) {
    data {
      id
      fullName
      phoneNumber
      clientType
    }
    total
    limit
    offset
  }
}

# Rechercher les clients par nom ou téléphone
query SearchClients($query: String!, $limit: Int, $offset: Int) {
  searchClients(query: $query, limit: $limit, offset: $offset) {
    id
    fullName
    phoneNumber
    clientType
    accessPointId
  }
}

# Récupérer l'historique des assignations IP d'un client
query IpAssignmentHistory($ipAddressId: ID!) {
  ipAssignmentHistory(ipAddressId: $ipAddressId) {
    id
    ipAddressId
    clientId
    accessPointId
    status
    assignedAt
    releasedAt
  }
}
```

### ✏️ Mutations (4)

```graphql
# Créer un nouveau client
mutation CreateClient($input: CreateClientInput!) {
  createClient(input: $input) {
    id
    fullName
    phoneNumber
    clientType
    accessPointId
  }
}

# Mettre à jour les infos d'un client
mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {
  updateClient(id: $id, input: $input) {
    id
    fullName
    phoneNumber
    clientType
  }
}

# Déplacer un client vers un autre point d'accès
mutation ChangeClientAccessPoint($input: ChangeAccessPointInput!) {
  changeClientAccessPoint(input: $input) {
    id
    fullName
    accessPointId
  }
}

# Supprimer un client
mutation DeleteClient($id: ID!) {
  deleteClient(id: $id)
}
```

---

## 🌐 Domaine 3 : IpAddress / IpAssignment (15 opérations)

**Attribution, libération, réservation et historique des IPs**

### 📖 Queries (8)

```graphql
# Récupérer une adresse IP par ID
query GetIpAddress($id: ID!) {
  getIpAddress(id: $id) {
    id
    address
    status
    usageType
    reserved
    active
    networkId
  }
}

# Lister les IPs disponibles d'un réseau (paginé)
query ListAvailableIps($networkId: ID!, $limit: Int, $offset: Int) {
  listAvailableIps(networkId: $networkId, limit: $limit, offset: $offset) {
    data {
      id
      address
      status
      usageType
    }
    total
    limit
    offset
  }
}

# Lister les IPs par statut (paginé)
query ListIpAddressesByStatus($status: IpAddressStatus!, $limit: Int, $offset: Int) {
  listIpAddressesByStatus(status: $status, limit: $limit, offset: $offset) {
    data {
      id
      address
      status
      networkId
    }
    total
    limit
    offset
  }
}

# Lister toutes les IPs d'un réseau (paginé)
query ListIpAddressesByNetwork($networkId: ID!, $limit: Int, $offset: Int) {
  listIpAddressesByNetwork(networkId: $networkId, limit: $limit, offset: $offset) {
    data {
      id
      address
      status
      usageType
      reserved
    }
    total
    limit
    offset
  }
}

# Récupérer l'historique des assignations d'une IP
query IpAssignmentHistory($ipAddressId: ID!) {
  ipAssignmentHistory(ipAddressId: $ipAddressId) {
    id
    ipAddressId
    clientId
    accessPointId
    status
    assignedAt
    releasedAt
  }
}

# Lister les assignations valides avec clients
query ListActiveAssignments {
  listActiveAssignments {
    id
    ipAddressId
    clientId
    accessPointId
    status
    assignedAt
  }
}

# Compter les IPs libres par réseau
query CountFreeIpsByNetwork($networkId: ID!) {
  countFreeIpsByNetwork(networkId: $networkId)
}

# Récupérer le taux d'utilisation des IPs par réseau
query IpUtilizationByNetwork($networkId: ID!) {
  ipUtilizationByNetwork(networkId: $networkId) {
    networkId
    totalIps
    usedIps
    freeIps
    utilizationPercentage
  }
}
```

### ✏️ Mutations (7)

```graphql
# Créer une adresse IP
mutation CreateIpAddress($input: CreateIpAddressInput!) {
  createIpAddress(input: $input) {
    id
    address
    status
    usageType
    networkId
  }
}

# Assigner une IP à un client
mutation AssignIp($input: AssignIpInput!) {
  assignIp(input: $input) {
    id
    ipAddressId
    clientId
    accessPointId
    status
    assignedAt
  }
}

# Libérer une IP (la rendre disponible)
mutation ReleaseIp($ipAddressId: ID!) {
  releaseIp(ipAddressId: $ipAddressId)
}

# Réserver une IP pour usage spécifique (management, infrastructure)
mutation ReserveIp($input: ReserveIpInput!) {
  reserveIp(input: $input) {
    id
    address
    status
    usageType
    reserved
  }
}

# Désactiver une IP (la marquer comme décommissionnée)
mutation DecommissionIp($input: DecommissionIpInput!) {
  decommissionIp(input: $input) {
    id
    address
    status
    active
  }
}

# Assigner des IPs à plusieurs clients (bulk)
mutation BulkAssignIp($input: BulkAssignIpInput!) {
  bulkAssignIp(input: $input) {
    id
    ipAddressId
    clientId
    status
    assignedAt
  }
}

# Générer automatiquement toutes les IPs d'un réseau
mutation GenerateNetworkIps($networkId: ID!) {
  generateNetworkIps(networkId: $networkId) {
    totalGenerated
    startIp
    endIp
  }
}
```

---

## 📍 Domaine 4 : Géolocalisation / CPE (10 opérations)

**Position GPS des équipements, rapports terrain pour techniciens**

### 📖 Queries (5)

```graphql
# Récupérer les infos d'un CPE (Customer Premises Equipment)
query GetCpeDevice($id: ID!) {
  getCpeDevice(id: $id) {
    id
    clientId
    accessPointId
    model
    macAddress
    coordinates { latitude, longitude, altitude }
    azimuth
  }
}

# Lister les CPEs d'un point d'accès (sur une carte)
query ListCpesByAccessPoint($accessPointId: ID!) {
  listCpesByAccessPoint(accessPointId: $accessPointId) {
    id
    clientId
    model
    macAddress
    coordinates { latitude, longitude, altitude }
    azimuth
  }
}

# Lister les CPEs d'un client
query ListCpesByClient($clientId: ID!) {
  listCpesByClient(clientId: $clientId) {
    id
    model
    macAddress
    coordinates { latitude, longitude, altitude }
    azimuth
  }
}

# Récupérer un rapport terrain pour un CPE
query GetFieldReport($cpeId: ID!) {
  getFieldReport(cpeId: $cpeId) {
    cpe {
      id
      clientId
      model
      macAddress
      coordinates { latitude, longitude, altitude }
    }
    accessPoint {
      id
      name
      coordinates { latitude, longitude, altitude }
    }
    latestSignal {
      rssi
      snr
      quality
      measuredAt
    }
    evaluation {
      quality
      needsRealignment
      recommendation
    }
    distanceMeters
    signalHistory {
      rssi
      quality
      measuredAt
    }
  }
}

# Récupérer les CPEs dans une zone géographique
query ListCpesInZone($latitude: Float!, $longitude: Float!, $radiusKm: Float!) {
  listCpesInZone(latitude: $latitude, longitude: $longitude, radiusKm: $radiusKm) {
    id
    clientId
    model
    coordinates { latitude, longitude, altitude }
    distanceKm
  }
}
```

### ✏️ Mutations (5)

```graphql
# Créer un nouveau CPE
mutation CreateCpeDevice($input: CreateCpeInput!) {
  createCpeDevice(input: $input) {
    id
    clientId
    model
    macAddress
    coordinates { latitude, longitude, altitude }
  }
}

# Mettre à jour la position GPS d'un CPE
mutation UpdateCpeLocation($id: ID!, $coordinates: CoordinatesInput!, $azimuth: Float) {
  updateCpeLocation(id: $id, coordinates: $coordinates, azimuth: $azimuth) {
    id
    coordinates { latitude, longitude, altitude }
    azimuth
  }
}

# Mettre à jour les infos d'un CPE (modèle, mac)
mutation UpdateCpeDevice($id: ID!, $model: String, $macAddress: String) {
  updateCpeDevice(id: $id, model: $model, macAddress: $macAddress) {
    id
    model
    macAddress
  }
}

# Supprimer un CPE
mutation DeleteCpeDevice($id: ID!) {
  deleteCpeDevice(id: $id)
}

# Synchroniser les positions GPS (batch update)
mutation SyncCpeLocations($updates: [CpeLocationUpdate!]!) {
  syncCpeLocations(updates: $updates) {
    successful
    failed
    total
  }
}
```

---

## 📡 Domaine 5 : Signal / Alignement (8 opérations)

**Mesures RSSI/SNR, alertes de réalignement, tendances**

### 📖 Queries (4)

```graphql
# Obtenir le signal actuel d'un CPE
query GetCurrentSignal($cpeId: ID!) {
  getCurrentSignal(cpeId: $cpeId) {
    id
    cpeId
    rssi
    snr
    txPower
    rxPower
    linkQuality
    quality
    distance
    evaluation {
      quality
      needsRealignment
      recommendation
    }
    measuredAt
  }
}

# Récupérer l'historique des signaux d'un CPE
query GetSignalHistory($cpeId: ID!, $limit: Int) {
  getSignalHistory(cpeId: $cpeId, limit: $limit) {
    id
    rssi
    snr
    quality
    distance
    measuredAt
  }
}

# Lister les CPEs qui ont besoin d'un réalignement
query ListCpesNeedingRealignment($accessPointId: ID) {
  listCpesNeedingRealignment(accessPointId: $accessPointId) {
    cpe {
      id
      clientId
      model
      coordinates { latitude, longitude, altitude }
    }
    latestSignal {
      rssi
      snr
      quality
    }
    evaluation {
      quality
      needsRealignment
      recommendation
    }
  }
}

# Récupérer les statistiques de signal d'un point d'accès
query GetAccessPointSignalStats($accessPointId: ID!) {
  getAccessPointSignalStats(accessPointId: $accessPointId) {
    accessPointId
    totalCpes
    averageRssi
    averageSnr
    cpesByQuality {
      excellent
      good
      fair
      poor
      critical
    }
    needsRealignmentCount
  }
}
```

### ✏️ Mutations (4)

```graphql
# Enregistrer une mesure de signal
mutation RecordSignalMetric($input: RecordSignalInput!) {
  recordSignalMetric(input: $input) {
    id
    cpeId
    rssi
    snr
    quality
    evaluation {
      quality
      needsRealignment
      recommendation
    }
    measuredAt
  }
}

# Enregistrer plusieurs mesures de signal (batch)
mutation RecordSignalMetrics($inputs: [RecordSignalInput!]!) {
  recordSignalMetrics(inputs: $inputs) {
    successful
    failed
    total
  }
}

# Marquer un CPE comme réaligné
mutation MarkCpeAsRealigned($cpeId: ID!) {
  markCpeAsRealigned(cpeId: $cpeId) {
    id
    latestSignal {
      quality
    }
  }
}

# Récupérer les alertes de signal
query ListSignalAlerts($accessPointId: ID, $limit: Int) {
  listSignalAlerts(accessPointId: $accessPointId, limit: $limit) {
    id
    cpeId
    alertType
    rssiThreshold
    currentRssi
    createdAt
  }
}
```

---

## 🧮 Domaine 6 : Calcul IP / Sous-réseau (8 opérations)

**Calculs CIDR, découpage, suggestion auto, génération d'IPs**

### 📖 Queries (4)

```graphql
# Calculer les infos d'un CIDR sans créer de réseau
query CalculateSubnet($cidr: String!) {
  calculateSubnet(cidr: $cidr) {
    cidr
    networkAddress
    broadcastAddress
    subnetMask
    wildcardMask
    usableStart
    usableEnd
    totalHosts
    prefix
    isPrivate
  }
}

# Vérifier si une IP appartient à un réseau
query IsIpInNetwork($ip: String!, $networkId: ID!) {
  isIpInNetwork(ip: $ip, networkId: $networkId)
}

# Suggérer le prochain réseau disponible
query SuggestNextNetwork($baseNetworkId: ID!, $prefix: Int!) {
  suggestNextNetwork(baseNetworkId: $baseNetworkId, prefix: $prefix)
}

# Récupérer les statistiques globales de tous les réseaux
query GlobalIpStats {
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
}
```

### ✏️ Mutations (4)

```graphql
# Découper un réseau en sous-réseaux
mutation SplitNetwork($networkId: ID!, $newPrefix: Int!) {
  splitNetwork(networkId: $networkId, newPrefix: $newPrefix) {
    cidr
    networkAddress
    broadcastAddress
    subnetMask
    totalHosts
    isPrivate
  }
}

# Agréger plusieurs réseaux (inverse du découpage)
mutation SummarizeNetworks($networkIds: [ID!]!) {
  summarizeNetworks(networkIds: $networkIds) {
    cidr
    networkAddress
    broadcastAddress
    subnetMask
    totalHosts
    isPrivate
  }
}

# Générer automatiquement toutes les IPs d'un réseau
mutation GenerateNetworkIps($networkId: ID!) {
  generateNetworkIps(networkId: $networkId) {
    totalGenerated
    startIp
    endIp
  }
}

# Vérifier et corriger le chevauchement de réseaux
mutation ValidateNetworkOverlap($cidr1: String!, $cidr2: String!) {
  validateNetworkOverlap(cidr1: $cidr1, cidr2: $cidr2) {
    overlaps
    message
  }
}
```

---

## 📊 Domaine 7 : Audit (1 opération)

**Automatique, déclenché par les use cases, pas de mutations manuelles**

### 📖 Queries (1)

```graphql
# Récupérer l'historique d'audit (lecture seule)
query ListAuditEvents($entity: String, $entityId: ID, $limit: Int, $offset: Int) {
  listAuditEvents(entity: $entity, entityId: $entityId, limit: $limit, offset: $offset) {
    id
    entity
    entityId
    action
    payload
    performedBy
    createdAt
  }
}
```

**Note:** Pas de mutations d'audit manuelles. L'audit est créé automatiquement par chaque use case lors de :
- ✅ Création d'une base, access point, réseau, client, CPE
- ✅ Modification d'état (activate, deactivate, maintenance)
- ✅ Assignment/Release/Reserve d'IPs
- ✅ Enregistrement de mesures de signal
- ✅ Mise à jour de positions GPS

---

## 📈 Résumé des types de réponse

```graphql
type Coordinates {
  latitude: Float!
  longitude: Float!
  altitude: Float
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

type NetworkStats {
  networkId: ID!
  totalIps: Int!
  freeIps: Int!
  occupiedIps: Int!
  reservedIps: Int!
  decommissionedIps: Int!
}

type FieldReport {
  cpe: CpeDevice!
  accessPoint: AccessPoint!
  latestSignal: SignalMetric!
  evaluation: SignalEvaluation!
  distanceMeters: Float
  signalHistory: [SignalMetric!]!
}

type SignalEvaluation {
  quality: SignalQuality!
  needsRealignment: Boolean!
  recommendation: String!
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
```

---

## 🚀 Cas d'usage typiques

### Technicien sur le terrain
1. Query `getFieldReport` → infos complètes sur un CPE
2. Query `listCpesNeedingRealignment` → liste des CPEs à réaligner
3. Mutation `updateCpeLocation` → mettre à jour la position
4. Mutation `recordSignalMetric` → enregistrer les mesures

### Administrateur réseau
1. Query `globalIpStats` → vue d'ensemble
2. Query `networkStats` → détails par réseau
3. Query `listIpAddressesByStatus` → IPs libres/occupées/réservées
4. Mutation `generateNetworkIps` → générer IPs d'un nouveau réseau

### Support client
1. Query `searchClients` → trouver le client
2. Query `getClient` → infos complètes
3. Query `listCpesByClient` → équipements du client
4. Mutation `changeClientAccessPoint` → changer de couverture

### Planification réseau
1. Query `calculateSubnet` → simuler un CIDR
2. Query `suggestNextNetwork` → proposer le prochain réseau
3. Mutation `splitNetwork` → découper un réseau
4. Query `validateNetworkOverlap` → vérifier chevauche

---

## ✅ Statut d'implémentation

- ✅ Schéma GraphQL complet défini
- ✅ Types et inputs GraphQL
- ✅ Resolvers pour tous les domaines
- ⏳ Services et use cases (en cours)
- ⏳ Repositories (en cours)
- ⏳ Tests d'intégration (à venir)
