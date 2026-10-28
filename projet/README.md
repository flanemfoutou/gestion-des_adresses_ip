# Cambium Network Control

Frontend Next.js 15 avec TypeScript, Apollo Client, Tailwind CSS 4 et composants UI inspirés de shadcn/ui.

## Démarrage local

Depuis ce dossier :

```bash
bun install
bun run dev
```

L’interface démarre sur [http://localhost:3000](http://localhost:3000). Le backend GraphQL et sa base PostgreSQL doivent également être disponibles ; suivez les instructions du [README principal](../README.md).

Pour utiliser une autre URL d’API, copiez `.env.local.example` vers `.env.local` et définissez `NEXT_PUBLIC_GRAPHQL_URL`. L’origine de cette interface doit aussi figurer dans `CORS_ORIGIN` côté backend.

Pour afficher la carte, configurez également `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` dans `.env.local`. Cette clé est nécessairement visible dans le navigateur : créez une clé dédiée, limitez-la aux référents HTTP des domaines de l’application et à l’API **Maps JavaScript API**, avec la facturation Google Cloud activée. Ne placez jamais une clé serveur dans `NEXT_PUBLIC_*`. L’application n’appelle aucun service Google depuis le backend et n’a pas besoin de l’API Geocoding. Les chargements de cartes peuvent entraîner des frais selon les quotas et tarifs Google Maps Platform; consultez [la grille tarifaire officielle](https://developers.google.com/maps/billing-and-pricing/pricing) et configurez des quotas/alertes dans Google Cloud.

La géolocalisation du navigateur nécessite l’autorisation de l’utilisateur et un contexte sécurisé (HTTPS, ou localhost). Un refus ou une indisponibilité GPS affiche un message et ne crée ni coordonnées ni données de remplacement.

## Carte et opérations GraphQL

L’onglet **Carte** récupère les bases, points d’accès, clients et CPE via `listMapLocations`. Les marqueurs n’apparaissent que si la base contient réellement leurs coordonnées. Un clic sur un équipement affiche son type, sa position enregistrée, l’adresse du site lorsqu’elle existe et l’AP géolocalisé le plus proche avec sa distance. Les coordonnées modifiées ou choisies sur la carte sont prévisualisées avant leur enregistrement. Le formulaire utilise les mutations existantes `updateBase`, `updateAccessPoint`, `updateClientLocation` et `updateCpeLocation`; les coordonnées saisies sont validées par le backend et relues après enregistrement.

Le dépôt contient un `.env.local` local avec `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` laissé vide, car une clé Google valide doit être fournie par l’exploitant. Ajoutez la clé navigateur restreinte dans cette variable puis redémarrez Next.js pour afficher la carte. Sans clé, les coordonnées restent consultables et modifiables depuis le panneau.

La recherche d’un AP à partir d’une position quelconque utilise `findNearestAccessPointAtPosition`; `distanceMeters` est une distance géodésique à vol d’oiseau calculée par le service Haversine existant.

```graphql
query MapLocations {
  listMapLocations {
    id
    kind
    name
    parentName
    latitude
    longitude
  }
}

query NearestAccessPoint($coordinates: CoordinatesInput!) {
  findNearestAccessPointAtPosition(coordinates: $coordinates) {
    accessPointId
    accessPointName
    baseName
    distanceMeters
    latitude
    longitude
  }
}
```

Variables d’exemple de recherche (à remplacer par une position réelle) :

```json
{
  "coordinates": {
    "latitude": 14.6928,
    "longitude": -17.4467
  }
}
```

La migration Drizzle `0002_geolocation_coordinates.sql` ajoute les trois colonnes facultatives aux clients; les champs des autres entités existent déjà. Après vérification et sauvegarde de la base, appliquez-la depuis la racine avec `bun run db:migrate`.

La création d’un client enchaîne `createClient` puis `assignIp` avec l’adresse sélectionnée. L’API vérifie que cette adresse appartient au réseau demandé et qu’elle est encore disponible. Si l’affectation échoue après la création, l’interface signale explicitement cet état partiel au lieu d’afficher un succès.

## Vérification

```bash
bun run build
```
