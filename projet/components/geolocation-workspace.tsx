"use client";

import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import {
  APIProvider,
  InfoWindow,
  Map as GoogleMap,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  Crosshair,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  FIND_NEAREST_ACCESS_POINT_AT_POSITION_QUERY,
  MAP_LOCATIONS_QUERY,
  UPDATE_ACCESS_POINT_MUTATION,
  UPDATE_BASE_MUTATION,
  UPDATE_CLIENT_LOCATION_MUTATION,
  UPDATE_CPE_LOCATION_MUTATION,
} from "@/lib/graphql/operations";
import { toBackendId } from "@/lib/graphql/ids";
import type {
  Coordinates,
  MapEntityKind,
  MapLocationRecord,
} from "@/lib/graphql/types";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const kinds: Record<MapEntityKind, { label: string; color: string }> = {
  base: { label: "Base", color: "#b35f32" },
  accessPoint: { label: "Point d’accès", color: "#326caa" },
  client: { label: "Client", color: "#31835f" },
  cpe: { label: "CPE", color: "#8158a9" },
};

const markerPaths: Record<MapEntityKind, string> = {
  base: "M 0,-11 A 11,11 0 1,1 0,11 A 11,11 0 1,1 0,-11 Z",
  accessPoint: "M 0,-13 L 11,0 L 0,13 L -11,0 Z",
  client:
    "M 0,-14 C 8,-14 11,-8 11,-2 C 11,5 0,14 0,14 C 0,14 -11,5 -11,-2 C -11,-8 -8,-14 0,-14 Z",
  cpe: "M -9,-9 L 9,-9 L 9,9 L -9,9 Z",
};

type DraftCoordinates = {
  latitude: string;
  longitude: string;
  altitude: string;
};

type Notice = { kind: "success" | "error"; message: string };

function MapCamera({ position }: { position: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: position.latitude, lng: position.longitude });
    map.setZoom(14);
  }, [map, position.latitude, position.longitude]);

  return null;
}

function formatCoordinates(location: MapLocationRecord) {
  if (location.latitude == null || location.longitude == null) {
    return "Coordonnées manquantes";
  }
  return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
}

export function GeolocationWorkspace() {
  const mapQuery = useQuery(MAP_LOCATIONS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedId, setSelectedId] = useState<string>();
  const [draft, setDraft] = useState<DraftCoordinates>({
    latitude: "",
    longitude: "",
    altitude: "",
  });
  const [userPosition, setUserPosition] = useState<Coordinates>();
  const [googleMapError, setGoogleMapError] = useState<string>();
  const [nearestCoordinatesKey, setNearestCoordinatesKey] = useState<string>();

  const mapLocations = mapQuery.data?.listMapLocations ?? [];
  const selectedLocation =
    mapLocations.find((location) => location.id === selectedId) ??
    mapLocations[0];
  const locationsWithCoordinates = mapLocations.filter(
    (location): location is MapLocationRecord & {
      latitude: number;
      longitude: number;
    } => location.latitude != null && location.longitude != null,
  );
  const selectedPosition =
    selectedLocation?.latitude != null && selectedLocation.longitude != null
      ? {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        }
      : undefined;
  const draftPosition = (() => {
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    if (
      !draft.latitude.trim() ||
      !draft.longitude.trim() ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return undefined;
    }
    return { latitude, longitude };
  })();
  const draftDiffersFromSaved =
    !!draftPosition &&
    (!selectedPosition ||
      draftPosition.latitude !== selectedPosition.latitude ||
      draftPosition.longitude !== selectedPosition.longitude);
  const mapCenter =
    userPosition ?? draftPosition ?? selectedPosition ?? locationsWithCoordinates[0];

  useEffect(() => {
    if (!selectedLocation) return;
    setDraft({
      latitude: selectedLocation.latitude?.toString() ?? "",
      longitude: selectedLocation.longitude?.toString() ?? "",
      altitude: selectedLocation.altitude?.toString() ?? "",
    });
  }, [
    selectedLocation?.id,
    selectedLocation?.latitude,
    selectedLocation?.longitude,
    selectedLocation?.altitude,
  ]);

  const mapMutationOptions = {
    refetchQueries: [{ query: MAP_LOCATIONS_QUERY }],
    awaitRefetchQueries: true,
  };
  const [updateBase, updateBaseState] = useMutation(
    UPDATE_BASE_MUTATION,
    mapMutationOptions,
  );
  const [updateAccessPoint, updateAccessPointState] = useMutation(
    UPDATE_ACCESS_POINT_MUTATION,
    mapMutationOptions,
  );
  const [updateClientLocation, updateClientLocationState] = useMutation(
    UPDATE_CLIENT_LOCATION_MUTATION,
    mapMutationOptions,
  );
  const [updateCpeLocation, updateCpeLocationState] = useMutation(
    UPDATE_CPE_LOCATION_MUTATION,
    mapMutationOptions,
  );
  const [findNearestAccessPoint, nearestAccessPointState] = useLazyQuery(
    FIND_NEAREST_ACCESS_POINT_AT_POSITION_QUERY,
  );
  useEffect(() => {
    if (!draftPosition) {
      setNearestCoordinatesKey(undefined);
      return;
    }

    const coordinatesKey = `${draftPosition.latitude},${draftPosition.longitude}`;
    let active = true;
    setNearestCoordinatesKey(undefined);
    const timeout = window.setTimeout(() => {
      void findNearestAccessPoint({
        variables: {
          coordinates: {
            latitude: draftPosition.latitude,
            longitude: draftPosition.longitude,
          },
        },
      }).then(
        () => {
          if (active) setNearestCoordinatesKey(coordinatesKey);
        },
        () => {
          if (active) setNearestCoordinatesKey(coordinatesKey);
        },
      );
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [draftPosition?.latitude, draftPosition?.longitude, findNearestAccessPoint]);
  const saving =
    updateBaseState.loading ||
    updateAccessPointState.loading ||
    updateClientLocationState.loading ||
    updateCpeLocationState.loading;

  function setCoordinates(coordinates: Coordinates) {
    setDraft((current) => ({
      ...current,
      latitude: coordinates.latitude.toString(),
      longitude: coordinates.longitude.toString(),
    }));
  }

  function locateUser() {
    setNotice(null);
    if (!navigator.geolocation) {
      setNotice({
        kind: "error",
        message: "La géolocalisation n’est pas prise en charge par ce navigateur.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const coordinates = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        setCoordinates(coordinates);
        setUserPosition(coordinates);
        setNotice({
          kind: "success",
          message:
            "Position GPS récupérée. Enregistrez pour l’associer à l’élément sélectionné.",
        });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Autorisation de géolocalisation refusée. Autorisez l’accès à votre position dans les réglages du navigateur."
            : error.code === error.POSITION_UNAVAILABLE
              ? "La position GPS est indisponible. Vérifiez le signal et réessayez."
              : error.code === error.TIMEOUT
                ? "La recherche GPS a expiré. Réessayez dans un endroit mieux couvert."
                : "Impossible de récupérer la position GPS.";
        setNotice({ kind: "error", message });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  async function saveCoordinates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    if (!selectedLocation) return;

    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    const altitude = draft.altitude.trim() ? Number(draft.altitude) : undefined;
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180 ||
      (altitude !== undefined && !Number.isFinite(altitude))
    ) {
      setNotice({
        kind: "error",
        message:
          "Saisissez une latitude entre -90 et 90 et une longitude entre -180 et 180.",
      });
      return;
    }

    const coordinates = { latitude, longitude, altitude };
    try {
      const id = toBackendId(selectedLocation.id);
      if (selectedLocation.kind === "base") {
        await updateBase({ variables: { id, input: { coordinates } } });
      } else if (selectedLocation.kind === "accessPoint") {
        await updateAccessPoint({ variables: { id, input: { coordinates } } });
      } else if (selectedLocation.kind === "client") {
        await updateClientLocation({
          variables: { clientId: id, coordinates },
        });
      } else {
        await updateCpeLocation({
          variables: {
            id,
            coordinates,
            azimuth: selectedLocation.azimuth,
          },
        });
      }
      setNotice({
        kind: "success",
        message: `Coordonnées enregistrées pour « ${selectedLocation.name} ».`,
      });
      setUserPosition(undefined);
    } catch (error) {
      setNotice({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "L’enregistrement des coordonnées a échoué.",
      });
    }
  }

  async function searchNearestAccessPoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setNotice({
        kind: "error",
        message:
          "Saisissez une latitude entre -90 et 90 et une longitude entre -180 et 180.",
      });
      return;
    }
    try {
      await findNearestAccessPoint({
        variables: { coordinates: { latitude, longitude } },
      });
      setNearestCoordinatesKey(`${latitude},${longitude}`);
    } catch (error) {
      setNotice({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "La recherche du point d’accès le plus proche a échoué.",
      });
    }
  }

  const nearest =
    draftPosition &&
    nearestCoordinatesKey ===
      `${draftPosition.latitude},${draftPosition.longitude}`
      ? nearestAccessPointState.data?.findNearestAccessPointAtPosition
      : undefined;
  const noApiKey = !MAPS_API_KEY;

  return (
    <section className="geolocation-workspace" aria-label="Carte géographique">
      <div className="geolocation-heading">
        <div>
          <div className="section-overline">GÉOLOCALISATION</div>
          <h2>Carte de l’infrastructure</h2>
          <p>
            Les positions proviennent de la base de données. Sélectionnez un
            élément pour modifier ses coordonnées.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void mapQuery.refetch()}
          disabled={mapQuery.loading}
        >
          {mapQuery.loading ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Actualiser
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={locateUser}
          title="Récupérer la position de cet appareil"
        >
          <Crosshair size={14} />
          Position GPS
        </Button>
      </div>

      <div className="geolocation-legend" aria-label="Légende des marqueurs">
        {(Object.keys(kinds) as MapEntityKind[]).map((kind) => (
          <span key={kind}>
            <i className={`geo-legend-marker geo-marker-${kind}`} />
            {kinds[kind].label}
          </span>
        ))}
      </div>

      {notice && (
        <div
          className={`operation-notice ${notice.kind === "error" ? "notice-error" : "notice-success"}`}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          {notice.message}
        </div>
      )}

      {mapQuery.error && (
        <div className="api-alert" role="alert">
          <span>
            <strong>Impossible de charger les emplacements.</strong>{" "}
            {mapQuery.error.message}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => void mapQuery.refetch()}
          >
            Réessayer
          </Button>
        </div>
      )}

      <div className="geolocation-grid">
        <aside className="geolocation-sidebar">
          <div className="geo-panel geo-entity-panel">
            <div className="geo-panel-heading">
              <div>
                <strong>Éléments</strong>
                <span>
                  {locationsWithCoordinates.length} géolocalisé(s) sur{" "}
                  {mapLocations.length}
                </span>
              </div>
            </div>
            {mapQuery.loading && !mapLocations.length ? (
              <div className="geo-state">
                <LoaderCircle size={18} className="animate-spin" />
                Chargement des éléments…
              </div>
            ) : mapLocations.length ? (
              <ul className="geo-entity-list">
                {mapLocations.map((location) => (
                  <li key={`${location.kind}-${location.id}`}>
                    <button
                      type="button"
                      className={
                        selectedLocation?.id === location.id
                          ? "geo-entity active"
                          : "geo-entity"
                      }
                      onClick={() => {
                        setSelectedId(location.id);
                        setUserPosition(undefined);
                        setNotice(null);
                      }}
                      aria-pressed={selectedLocation?.id === location.id}
                    >
                      <i
                        className={`geo-legend-marker geo-marker-${location.kind}`}
                      />
                      <span>
                        <strong>{location.name}</strong>
                        <small>
                          {kinds[location.kind].label}
                          {location.parentName
                            ? ` · ${location.parentName}`
                            : ""}
                        </small>
                      </span>
                      <small className="geo-entity-coordinates">
                        {formatCoordinates(location)}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="geo-state">
                Aucun élément à afficher. Vérifiez la connexion à l’API.
              </div>
            )}
          </div>

          {selectedLocation && (
            <div className="geo-panel geo-coordinate-panel">
              <div className="geo-panel-heading">
                <div>
                  <strong>Détails de l’équipement</strong>
                  <span>{selectedLocation.name}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={locateUser}
                  title="Récupérer la position de cet appareil"
                >
                  <Crosshair size={14} />
                  GPS
                </Button>
              </div>
              <dl className="geo-location-details">
                <div>
                  <dt>Type</dt>
                  <dd>{kinds[selectedLocation.kind].label}</dd>
                </div>
                <div>
                  <dt>Adresse / site</dt>
                  <dd>{selectedLocation.address || "Non renseignée"}</dd>
                </div>
                <div>
                  <dt>Position enregistrée</dt>
                  <dd>{formatCoordinates(selectedLocation)}</dd>
                </div>
                <div>
                  <dt>AP le plus proche</dt>
                  <dd>
                    {nearestAccessPointState.loading
                      ? "Calcul en cours…"
                      : nearest
                        ? `${nearest.accessPointName} · ${nearest.distanceMeters.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} m`
                        : nearestAccessPointState.error
                          ? "Recherche indisponible"
                          : draftPosition
                            ? "Aucun AP géolocalisé"
                            : "Position nécessaire"}
                  </dd>
                </div>
              </dl>
              {nearestAccessPointState.error && (
                <p className="geo-error" role="alert">
                  {nearestAccessPointState.error.message}
                </p>
              )}
              <form className="geo-coordinate-form" onSubmit={saveCoordinates}>
                <label>
                  Latitude
                  <input
                    type="number"
                    name="latitude"
                    min="-90"
                    max="90"
                    step="any"
                    required
                    value={draft.latitude}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        latitude: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Longitude
                  <input
                    type="number"
                    name="longitude"
                    min="-180"
                    max="180"
                    step="any"
                    required
                    value={draft.longitude}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        longitude: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Altitude (m, facultative)
                  <input
                    type="number"
                    name="altitude"
                    step="any"
                    value={draft.altitude}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        altitude: event.target.value,
                      }))
                    }
                  />
                </label>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Enregistrer
                </Button>
              </form>

              <form
                className="geo-nearest-form"
                onSubmit={(event) => void searchNearestAccessPoint(event)}
              >
                <Button
                  type="submit"
                  variant="outline"
                  disabled={
                    nearestAccessPointState.loading ||
                    !draft.latitude ||
                    !draft.longitude
                  }
                >
                  {nearestAccessPointState.loading ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <Search size={14} />
                  )}
                  Chercher l’AP le plus proche
                </Button>
                {nearestAccessPointState.error && (
                  <p className="geo-error" role="alert">
                    {nearestAccessPointState.error.message}
                  </p>
                )}
                {nearest && (
                  <p className="geo-nearest-result" role="status">
                    <MapPin size={14} />
                    <span>
                      <strong>{nearest.accessPointName}</strong> ·{" "}
                      {nearest.baseName} ·{" "}
                      {nearest.distanceMeters.toLocaleString("fr-FR", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      m
                    </span>
                  </p>
                )}
              </form>
            </div>
          )}
          {!selectedLocation && (
            <div className="geo-panel geo-coordinate-panel">
              <div className="geo-panel-heading">
                <div>
                  <strong>Recherche par position</strong>
                  <span>
                    Aucun élément enregistré. Utilisez le GPS ou saisissez une
                    position.
                  </span>
                </div>
              </div>
              <div className="geo-coordinate-form">
                <label>
                  Latitude
                  <input
                    type="number"
                    min="-90"
                    max="90"
                    step="any"
                    value={draft.latitude}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        latitude: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Longitude
                  <input
                    type="number"
                    min="-180"
                    max="180"
                    step="any"
                    value={draft.longitude}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        longitude: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <form
                className="geo-nearest-form"
                onSubmit={(event) => void searchNearestAccessPoint(event)}
              >
                <Button
                  type="submit"
                  variant="outline"
                  disabled={
                    nearestAccessPointState.loading ||
                    !draft.latitude ||
                    !draft.longitude
                  }
                >
                  {nearestAccessPointState.loading ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <Search size={14} />
                  )}
                  Chercher l’AP le plus proche
                </Button>
                {nearestAccessPointState.error && (
                  <p className="geo-error" role="alert">
                    {nearestAccessPointState.error.message}
                  </p>
                )}
                {nearest && (
                  <p className="geo-nearest-result" role="status">
                    <MapPin size={14} />
                    <span>
                      <strong>{nearest.accessPointName}</strong> ·{" "}
                      {nearest.baseName} ·{" "}
                      {nearest.distanceMeters.toLocaleString("fr-FR", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      m
                    </span>
                  </p>
                )}
              </form>
            </div>
          )}
        </aside>

        <div className="geo-panel geo-map-panel">
          {noApiKey ? (
            <div className="geo-map-message" role="status">
              <MapPin size={28} />
              <strong>Clé Google Maps non configurée</strong>
              <span>
                Ajoutez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY au fichier .env.local
                du frontend. Les coordonnées restent modifiables sans la carte.
              </span>
            </div>
          ) : googleMapError ? (
            <div className="geo-map-message" role="alert">
              <MapPin size={28} />
              <strong>Google Maps n’a pas pu être chargé</strong>
              <span>{googleMapError}</span>
              <span>Vérifiez la clé, les restrictions de domaine et l’API Maps JavaScript.</span>
            </div>
          ) : !mapCenter ? (
            <div className="geo-map-message" role="status">
              <MapPin size={28} />
              <strong>Aucune position connue</strong>
              <span>
                Saisissez des coordonnées pour un élément ou utilisez le GPS
                pour définir une position réelle avant d’afficher la carte.
              </span>
            </div>
          ) : (
            <APIProvider
              apiKey={MAPS_API_KEY ?? ""}
              language="fr"
              region="SN"
              onError={(error) =>
                setGoogleMapError(
                  error instanceof Error
                    ? error.message
                    : "Erreur de chargement de l’API Google Maps.",
                )
              }
            >
              <GoogleMap
                className="geo-google-map"
                defaultCenter={{
                  lat: mapCenter.latitude,
                  lng: mapCenter.longitude,
                }}
                defaultZoom={12}
                gestureHandling="greedy"
                mapTypeControl
                streetViewControl={false}
                onClick={(event) => {
                  if (!selectedLocation || !event.detail.latLng) return;
                  setCoordinates({
                    latitude: event.detail.latLng.lat,
                    longitude: event.detail.latLng.lng,
                  });
                  setNotice({
                    kind: "success",
                    message:
                      "Position sélectionnée sur la carte. Enregistrez pour la persister.",
                  });
                }}
              >
                <MapCamera position={mapCenter} />
                {locationsWithCoordinates.map((location) => (
                  <Marker
                    key={`${location.kind}-${location.id}`}
                    position={{
                      lat: location.latitude,
                      lng: location.longitude,
                    }}
                    title={`${kinds[location.kind].label} · ${location.name}`}
                    icon={{
                      path: markerPaths[location.kind],
                      fillColor: kinds[location.kind].color,
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                      scale: 1,
                    }}
                    onClick={(event) => {
                      event.stop();
                      setSelectedId(location.id);
                      setUserPosition(undefined);
                    }}
                  />
                ))}
                {draftPosition && draftDiffersFromSaved && (
                  <Marker
                    position={{
                      lat: draftPosition.latitude,
                      lng: draftPosition.longitude,
                    }}
                    title="Nouvelle position à enregistrer"
                    icon={{
                      path: markerPaths[selectedLocation?.kind ?? "base"],
                      fillColor: "#e5a817",
                      fillOpacity: 0.9,
                      strokeColor: "#ffffff",
                      strokeWeight: 3,
                      scale: 1.2,
                    }}
                  />
                )}
                {userPosition && (
                  <Marker
                    position={{
                      lat: userPosition.latitude,
                      lng: userPosition.longitude,
                    }}
                    title="Position GPS de cet appareil"
                    icon={{
                      path: "M 0,-7 A 7,7 0 1,1 0,7 A 7,7 0 1,1 0,-7 Z",
                      fillColor: "#1d2939",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 3,
                      scale: 1,
                    }}
                  />
                )}
                {draftPosition && selectedLocation && (
                  <InfoWindow
                    position={{
                      lat: draftPosition.latitude,
                      lng: draftPosition.longitude,
                    }}
                  >
                    <div className="geo-info-window">
                      <strong>{selectedLocation.name}</strong>
                      <span>
                        {draftDiffersFromSaved
                          ? "Nouvelle position · à enregistrer"
                          : kinds[selectedLocation.kind].label}
                      </span>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
              <p className="geo-map-hint">
                Cliquez sur la carte pour choisir une nouvelle position pour
                l’élément sélectionné.
              </p>
            </APIProvider>
          )}
        </div>
      </div>
    </section>
  );
}
