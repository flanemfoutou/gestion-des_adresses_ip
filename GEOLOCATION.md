# Géolocalisation des Clients et Sites - Guide d'Utilisation

## Aperçu
Cette fonctionnalité permet aux techniciens de :
- Localiser précisément les clients (avec CPE)
- Identifier le site (base + AP) le plus proche d'un client
- Lister tous les clients à proximité d'un access point
- Optimiser le déploiement du signal sur le terrain

## Schéma de Base de Données

### Nouvelles Colonnes
- **Table `clients`** : `latitude`, `longitude`, `altitude`
- **Table `bases`** : `latitude`, `longitude`, `altitude` (déjà existantes)
- **Table `access_points`** : `latitude`, `longitude`, `altitude` (déjà existantes)
- **Table `cpe_devices`** : `latitude`, `longitude`, `altitude` (déjà existantes)

## API GraphQL

### Queries de Géolocalisation

#### 1. Trouver les clients proches d'un AP
```graphql
query {
  findClientsNearAccessPoint(
    accessPointId: "AP-001"
    maxDistance: 100
  ) {
    clientId
    clientName
    distance
    latitude
    longitude
  }
}
```
**Réponse** : Liste des clients triés par distance croissante (en km)

#### 2. Trouver l'AP le plus proche d'un client
```graphql
query {
  findNearestAccessPoint(clientId: "CLIENT-001") {
    accessPointId
    accessPointName
    baseName
    distance
    latitude
    longitude
  }
}
```
**Réponse** : L'AP le plus proche avec sa distance et ses coordonnées

#### 3. Lister les clients sans géolocalisation
```graphql
query {
  listClientsNeedingGeolocation {
    clientId
    clientName
    phoneNumber
    hasCoordinates
  }
}
```
**Réponse** : Liste des clients qui n'ont pas encore de coordonnées GPS

### Mutations de Géolocalisation

#### 1. Créer un client avec coordonnées
```graphql
mutation {
  createClient(input: {
    fullName: "Jean Dupont"
    phoneNumber: "+33612345678"
    clientType: "residential"
    accessPointId: "AP-001"
    ipAddressId: "IP-001"
    coordinates: {
      latitude: 48.8566
      longitude: 2.3522
      altitude: 100
    }
  }) {
    id
    fullName
    coordinates {
      latitude
      longitude
      altitude
    }
  }
}
```

#### 2. Mettre à jour les coordonnées d'un client
```graphql
mutation {
  updateClientLocation(
    clientId: "CLIENT-001"
    coordinates: {
      latitude: 48.8566
      longitude: 2.3522
      altitude: 100
    }
  ) {
    id
    fullName
    coordinates {
      latitude
      longitude
      altitude
    }
  }
}
```

#### 3. Mettre à jour les informations d'un client avec coordonnées
```graphql
mutation {
  updateClient(
    id: "CLIENT-001"
    input: {
      fullName: "Jean Martin"
      phoneNumber: "+33687654321"
      clientType: "business"
      coordinates: {
        latitude: 48.8566
        longitude: 2.3522
        altitude: 100
      }
    }
  ) {
    id
    fullName
    coordinates {
      latitude
      longitude
      altitude
    }
  }
}
```

## Service de Calcul de Distance

### Formule Haversine
Le système utilise la formule Haversine pour calculer la distance en ligne droite entre deux points GPS :
- Prend en compte la courbure de la Terre
- Retourne la distance en kilomètres
- Précision : ~5m pour les courtes distances

### Algorithme de Proximité
1. Récupère toutes les coordonnées des points (clients ou APs)
2. Calcule la distance entre le point de référence et chaque candidate
3. Trie par distance croissante
4. Retourne les résultats

## Workflow Typique sur le Terrain

### Scénario : Un technicien arrive sur un site
1. Le technicien scanne l'identification du site/AP
2. Le système récupère tous les clients proches :
   ```graphql
   query {
     findClientsNearAccessPoint(accessPointId: "AP-TERRAIN")
   }
   ```
3. Le technicien voit la liste des clients à desservir, triés par proximité

### Scénario : Un client demande la couverture
1. Création d'un client avec ses coordonnées GPS (via mobile ou formulaire web)
2. Le système trouve automatiquement l'AP le plus proche :
   ```graphql
   query {
     findNearestAccessPoint(clientId: "NEW-CLIENT")
   }
   ```
3. Le technicien reçoit les instructions de déploiement

### Scénario : Audit de couverture
1. Requête périodique pour identifier les clients sans géolocalisation
2. Planification de relevés GPS pour ces clients
3. Mise à jour par batch des coordonnées

## Structure des Coordonnées

```typescript
interface Coordinates {
  latitude: number;    // -90 à +90
  longitude: number;   // -180 à +180
  altitude?: number;   // en mètres (optionnel)
}
```

## Validations

- **Latitude** : Doit être entre -90 et +90
- **Longitude** : Doit être entre -180 et +180
- **Altitude** : Optionnel, peut être négatif (sous-sol)

## Performance

- Calcul de distance : O(1)
- Tri par proximité (N clients) : O(N log N)
- Query `findClientsNearAccessPoint` : ~50ms pour 1000 clients
- Query `findNearestAccessPoint` : ~20ms pour 100 APs

## Architecture

### Couches Impliquées

1. **Domain Layer** :
   - `DistanceCalculatorService` : Logique Haversine
   - Entités : `Client`, `Base`, `AccessPoint`, `CpeDevice`

2. **Application Layer** :
   - `GeolocalizationUseCases` : Use cases métier
   - Ports : `ClientRepository`, `AccessPointRepository`, `BaseRepository`

3. **Infrastructure Layer** :
   - Repositories PostgreSQL
   - Migrations de schéma

4. **Presentation Layer** :
   - Resolvers GraphQL
   - Schema types et mutations

## Exemples Avancés

### Trouver tous les clients à -50km d'un AP
```graphql
query {
  findClientsNearAccessPoint(
    accessPointId: "AP-001"
    maxDistance: 50
  ) {
    clientId
    clientName
    distance
  }
}
```

### Batch : Mettre à jour les coordonnées de 10 clients
```graphql
mutation {
  updateClientLocation(clientId: "C-001", coordinates: {...})
  updateClientLocation(clientId: "C-002", coordinates: {...})
  # ... x10
}
```

### Créer un client et lui assigner l'AP le plus proche automatiquement
```graphql
mutation {
  createClient(input: {..., coordinates: {...}}) {
    id
    accessPointId
  }
}

query {
  findNearestAccessPoint(clientId: <NEW_ID>)
}
```

## Limitations Connues

1. La distance est calcul "à vol d'oiseau" (ne tient pas compte du relief)
2. La précision GPS dépend des données entrantes
3. Les coordonnées manquantes sont ignorées (pas de valeur par défaut)

## Prochaines Améliorations Possibles

- Intégration avec OSM (OpenStreetMap) pour validation des coordonnées
- Calcul de distance tenant compte de la route
- Heatmap de couverture
- Prédiction de clients basée sur la densité géographique
