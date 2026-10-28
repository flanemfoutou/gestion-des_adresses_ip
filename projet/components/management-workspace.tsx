"use client";

import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CirclePlus,
  LoaderCircle,
  MapPin,
  MapPinned,
  Network,
  Pencil,
  Plus,
  Search,
  Signal,
  Trash2,
  UserRound,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GeolocationWorkspace } from "@/components/geolocation-workspace";
import { toBackendId } from "@/lib/graphql/ids";
import {
  ACCESS_POINTS_QUERY,
  ASSIGN_IP_MUTATION,
  AVAILABLE_IPS_QUERY,
  BASES_QUERY,
  CALCULATE_SUBNET_QUERY,
  CHANGE_CLIENT_ACCESS_POINT_MUTATION,
  CLIENTS_BY_ACCESS_POINT_QUERY,
  CLIENT_SEARCH_QUERY,
  CREATE_ACCESS_POINT_MUTATION,
  CREATE_BASE_MUTATION,
  CREATE_CLIENT_MUTATION,
  CREATE_IP_ADDRESS_MUTATION,
  CREATE_NETWORK_MUTATION,
  DECOMMISSION_IP_MUTATION,
  DELETE_BASE_MUTATION,
  DELETE_CLIENT_MUTATION,
  DELETE_NETWORK_MUTATION,
  DASHBOARD_QUERY,
  HEALTH_QUERY,
  IPS_BY_NETWORK_QUERY,
  NETWORKS_QUERY,
  NETWORK_STATS_QUERY,
  RELEASE_IP_MUTATION,
  RESERVE_IP_MUTATION,
  UPDATE_ACCESS_POINT_STATUS_MUTATION,
  UPDATE_BASE_MUTATION,
  UPDATE_CLIENT_MUTATION,
} from "@/lib/graphql/operations";
import type {
  AccessPointRecord,
  AccessPointStatus,
  BaseRecord,
  BaseStatus,
  CalculateSubnetQueryResult,
  ClientRecord,
  ClientType,
  IpAddressRecord,
  IpUsageType,
  NetworkRecord,
} from "@/lib/graphql/types";
import type { WorkspacePage } from "@/app/page";

type Page = "bases" | "networks" | "clients" | "ips" | "map";
type Notice = { kind: "success" | "error"; message: string };

const tabs: Array<{ id: Page; label: string; icon: typeof MapPin }> = [
  { id: "bases", label: "Sites & équipements", icon: MapPin },
  { id: "networks", label: "Réseaux", icon: Network },
  { id: "clients", label: "Clients", icon: UserRound },
  { id: "ips", label: "Adresses IP", icon: Wifi },
  { id: "map", label: "Carte", icon: MapPinned },
];

const statuses = {
  active: { label: "Active", tone: "green" as const },
  inactive: { label: "Inactive", tone: "gray" as const },
  maintenance: { label: "Maintenance", tone: "amber" as const },
  online: { label: "En ligne", tone: "green" as const },
  offline: { label: "Hors ligne", tone: "gray" as const },
  free: { label: "Disponible", tone: "green" as const },
  occupied: { label: "Attribuée", tone: "blue" as const },
  reserved: { label: "Réservée", tone: "amber" as const },
  decommissioned: { label: "Retirée", tone: "red" as const },
} as const;

type DialogState =
  | { kind: "base"; record?: BaseRecord }
  | { kind: "accessPoint" }
  | { kind: "network" }
  | { kind: "client"; record?: ClientRecord }
  | { kind: "ip" }
  | null;

function Status({ value }: { value: string }) {
  const status = statuses[value as keyof typeof statuses] ?? {
    label: value,
    tone: "gray" as const,
  };
  return (
    <Badge tone={status.tone}>
      <span className="status-dot" />
      {status.label}
    </Badge>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="manage-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="manage-input" {...props} />;
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="manage-input manage-select" {...props} />;
}

export function ManagementWorkspace({
  initialPage,
  onNavigate,
}: {
  initialPage: WorkspacePage;
  onNavigate: (page: WorkspacePage) => void;
}) {
  const [page, setPage] = useState<Page>(
    initialPage === "overview" ? "bases" : initialPage,
  );
  const [dialog, setDialog] = useState<DialogState>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBase, setSelectedBase] = useState("");
  const [selectedAccessPoint, setSelectedAccessPoint] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [networkCidr, setNetworkCidr] = useState("");

  const healthQuery = useQuery(HEALTH_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const basesQuery = useQuery(BASES_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const bases = basesQuery.data?.listBases ?? [];
  const accessPointsQuery = useQuery(ACCESS_POINTS_QUERY, {
    variables: { baseId: toBackendId(selectedBase) },
    skip: !selectedBase,
    fetchPolicy: "cache-and-network",
  });
  const accessPoints = accessPointsQuery.data?.listAccessPoints ?? [];
  const networksQuery = useQuery(NETWORKS_QUERY, {
    variables: { accessPointId: toBackendId(selectedAccessPoint) },
    skip: !selectedAccessPoint,
    fetchPolicy: "cache-and-network",
  });
  const networks = networksQuery.data?.listNetworks ?? [];
  const ipsQuery = useQuery(IPS_BY_NETWORK_QUERY, {
    variables: {
      networkId: toBackendId(selectedNetwork),
      limit: 100,
      offset: 0,
    },
    skip: !selectedNetwork,
    fetchPolicy: "cache-and-network",
  });
  const availableIpsQuery = useQuery(AVAILABLE_IPS_QUERY, {
    variables: {
      networkId: toBackendId(selectedNetwork),
      limit: 100,
      offset: 0,
    },
    skip: !selectedNetwork || dialog?.kind !== "client",
    fetchPolicy: "cache-and-network",
  });
  const ipStatsQuery = useQuery(NETWORK_STATS_QUERY, {
    variables: { networkId: toBackendId(selectedNetwork) },
    skip: !selectedNetwork,
    fetchPolicy: "cache-and-network",
  });
  const clientsQuery = useQuery(CLIENT_SEARCH_QUERY, {
    variables: { query: clientSearch.trim(), limit: 100, offset: 0 },
    skip: !clientSearch.trim() || page !== "clients",
    fetchPolicy: "cache-and-network",
  });
  const clientsByAccessPointQuery = useQuery(CLIENTS_BY_ACCESS_POINT_QUERY, {
    variables: {
      accessPointId: toBackendId(selectedAccessPoint),
      limit: 100,
      offset: 0,
    },
    skip:
      !selectedAccessPoint ||
      Boolean(clientSearch.trim()) ||
      page !== "clients",
    fetchPolicy: "cache-and-network",
  });
  const [calculateSubnet, subnetQuery] = useLazyQuery(CALCULATE_SUBNET_QUERY);

  useEffect(() => {
    if (!selectedBase && bases.length) setSelectedBase(bases[0].id);
  }, [bases, selectedBase]);
  useEffect(() => {
    setSelectedAccessPoint("");
    setSelectedNetwork("");
  }, [selectedBase]);
  useEffect(() => {
    if (!selectedAccessPoint && accessPoints.length)
      setSelectedAccessPoint(accessPoints[0].id);
  }, [accessPoints, selectedAccessPoint]);
  useEffect(() => {
    setSelectedNetwork("");
  }, [selectedAccessPoint]);
  useEffect(() => {
    if (!selectedNetwork && networks.length) setSelectedNetwork(networks[0].id);
  }, [networks, selectedNetwork]);

  const baseOptions = {
    refetchQueries: [{ query: BASES_QUERY }, { query: DASHBOARD_QUERY }],
    awaitRefetchQueries: true,
  };
  const [createBase, createBaseState] = useMutation(
    CREATE_BASE_MUTATION,
    baseOptions,
  );
  const [updateBase, updateBaseState] = useMutation(
    UPDATE_BASE_MUTATION,
    baseOptions,
  );
  const [deleteBase, deleteBaseState] = useMutation(
    DELETE_BASE_MUTATION,
    baseOptions,
  );
  const accessPointOptions = {
    refetchQueries: [
      {
        query: ACCESS_POINTS_QUERY,
        variables: { baseId: toBackendId(selectedBase) },
      },
    ],
    awaitRefetchQueries: true,
  };
  const networkOptions = {
    refetchQueries: [
      {
        query: NETWORKS_QUERY,
        variables: { accessPointId: toBackendId(selectedAccessPoint) },
      },
      { query: DASHBOARD_QUERY },
    ],
    awaitRefetchQueries: true,
  };
  const clientQueries = [
    {
      query: CLIENT_SEARCH_QUERY,
      variables: { query: clientSearch.trim(), limit: 100, offset: 0 },
    },
    {
      query: CLIENTS_BY_ACCESS_POINT_QUERY,
      variables: {
        accessPointId: toBackendId(selectedAccessPoint),
        limit: 100,
        offset: 0,
      },
    },
  ];
  const clientOptions = {
    refetchQueries: clientQueries,
    awaitRefetchQueries: true,
  };
  const ipQueries = [
    {
      query: IPS_BY_NETWORK_QUERY,
      variables: {
        networkId: toBackendId(selectedNetwork),
        limit: 100,
        offset: 0,
      },
    },
    {
      query: NETWORK_STATS_QUERY,
      variables: { networkId: toBackendId(selectedNetwork) },
    },
    {
      query: AVAILABLE_IPS_QUERY,
      variables: {
        networkId: toBackendId(selectedNetwork),
        limit: 100,
        offset: 0,
      },
    },
    { query: DASHBOARD_QUERY },
  ];
  const ipOptions = { refetchQueries: ipQueries, awaitRefetchQueries: true };
  const [createAccessPoint, createAccessPointState] = useMutation(
    CREATE_ACCESS_POINT_MUTATION,
    accessPointOptions,
  );
  const [updateAccessPointStatus, updateAccessPointState] = useMutation(
    UPDATE_ACCESS_POINT_STATUS_MUTATION,
    accessPointOptions,
  );
  const [createNetwork, createNetworkState] = useMutation(
    CREATE_NETWORK_MUTATION,
    networkOptions,
  );
  const [deleteNetwork, deleteNetworkState] = useMutation(
    DELETE_NETWORK_MUTATION,
    networkOptions,
  );
  const [createClient, createClientState] = useMutation(
    CREATE_CLIENT_MUTATION,
    clientOptions,
  );
  const [assignIp, assignIpState] = useMutation(ASSIGN_IP_MUTATION, ipOptions);
  const [updateClient, updateClientState] = useMutation(
    UPDATE_CLIENT_MUTATION,
    clientOptions,
  );
  const [deleteClient, deleteClientState] = useMutation(
    DELETE_CLIENT_MUTATION,
    clientOptions,
  );
  const [changeClientAccessPoint, changeAccessPointState] = useMutation(
    CHANGE_CLIENT_ACCESS_POINT_MUTATION,
    clientOptions,
  );
  const [createIpAddress, createIpState] = useMutation(
    CREATE_IP_ADDRESS_MUTATION,
    ipOptions,
  );
  const [releaseIp, releaseIpState] = useMutation(
    RELEASE_IP_MUTATION,
    ipOptions,
  );
  const [reserveIp, reserveIpState] = useMutation(
    RESERVE_IP_MUTATION,
    ipOptions,
  );
  const [decommissionIp, decommissionIpState] = useMutation(
    DECOMMISSION_IP_MUTATION,
    ipOptions,
  );

  const loading =
    createBaseState.loading ||
    updateBaseState.loading ||
    deleteBaseState.loading ||
    createAccessPointState.loading ||
    updateAccessPointState.loading ||
    createNetworkState.loading ||
    deleteNetworkState.loading ||
    createClientState.loading ||
    assignIpState.loading ||
    updateClientState.loading ||
    deleteClientState.loading ||
    changeAccessPointState.loading ||
    createIpState.loading ||
    releaseIpState.loading ||
    reserveIpState.loading ||
    decommissionIpState.loading;
  const clients = clientSearch.trim()
    ? (clientsQuery.data?.searchClients ?? [])
    : (clientsByAccessPointQuery.data?.listClients.data ?? []);
  const ips = ipsQuery.data?.listIpAddressesByNetwork?.data ?? [];
  const availableIps = availableIpsQuery.data?.listAvailableIps?.data ?? [];
  const networkStats = ipStatsQuery.data?.networkStats;
  const queryError =
    page === "map"
      ? undefined
      : page === "bases"
        ? (basesQuery.error ?? accessPointsQuery.error)
        : page === "networks"
          ? networksQuery.error
          : page === "clients"
            ? (clientsQuery.error ?? clientsByAccessPointQuery.error)
            : (ipsQuery.error ?? ipStatsQuery.error);
  const filteredBases = bases.filter((base) =>
    `${base.name} ${base.location}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const filteredNetworks = networks.filter((network) =>
    `${network.cidr} ${network.vlan}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const filteredClients = clients.filter((client) =>
    `${client.fullName} ${client.phoneNumber}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const filteredIps = ips.filter((ip) =>
    `${ip.address} ${ip.status} ${ip.usageType}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  async function runMutation(action: () => Promise<unknown>, success: string) {
    setNotice(null);
    try {
      await action();
      setNotice({ kind: "success", message: success });
      setDialog(null);
    } catch (error) {
      setNotice({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "La communication avec le serveur a échoué.",
      });
    }
  }

  async function refreshData() {
    setNotice(null);
    try {
      const requests: Promise<unknown>[] = [
        healthQuery.refetch(),
        basesQuery.refetch(),
      ];
      if (selectedBase) requests.push(accessPointsQuery.refetch());
      if (selectedAccessPoint) requests.push(networksQuery.refetch());
      if (selectedNetwork)
        requests.push(ipsQuery.refetch(), ipStatsQuery.refetch());
      if (page === "clients") {
        if (clientSearch.trim()) requests.push(clientsQuery.refetch());
        else if (selectedAccessPoint)
          requests.push(clientsByAccessPointQuery.refetch());
      }
      await Promise.all(requests);
    } catch (error) {
      setNotice({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d’actualiser les données.",
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();
    const number = (key: string) => Number(form.get(key));
    if (!dialog) return;

    if (dialog.kind === "base") {
      const input = {
        name: value("name"),
        location: value("location"),
        status: (value("status") || "active") as BaseStatus,
      };
      const record = dialog.record;
      if (record)
        await runMutation(
          () =>
            updateBase({ variables: { id: toBackendId(record.id), input } }),
          "La base a été mise à jour.",
        );
      else
        await runMutation(
          () => createBase({ variables: { input } }),
          "La base a été créée.",
        );
    } else if (dialog.kind === "accessPoint") {
      const input = {
        name: value("name"),
        managementIpId: value("managementIpId"),
        baseId: toBackendId(selectedBase),
        sector: value("sector"),
        status: (value("status") || "online") as AccessPointStatus,
      };
      await runMutation(
        () => createAccessPoint({ variables: { input } }),
        "Le point d’accès a été créé.",
      );
    } else if (dialog.kind === "network") {
      const input = {
        cidr: value("cidr"),
        gateway: value("gateway"),
        vlan: number("vlan"),
        accessPointId: toBackendId(selectedAccessPoint),
      };
      await runMutation(
        () => createNetwork({ variables: { input } }),
        "Le réseau a été créé.",
      );
    } else if (dialog.kind === "client") {
      const input = {
        fullName: value("fullName"),
        phoneNumber: value("phoneNumber"),
        clientType: value("clientType") as ClientType,
        accessPointId: toBackendId(selectedAccessPoint),
        ipAddressId: toBackendId(value("ipAddressId")),
      };
      const record = dialog.record;
      if (record)
        await runMutation(async () => {
          await updateClient({
            variables: {
              id: toBackendId(record.id),
              input: {
                fullName: input.fullName,
                phoneNumber: input.phoneNumber,
                clientType: input.clientType,
              },
            },
          });
          if (
            value("accessPointId") &&
            toBackendId(value("accessPointId")) !==
              toBackendId(record.accessPointId)
          ) {
            await changeClientAccessPoint({
              variables: {
                input: {
                  clientId: toBackendId(record.id),
                  newAccessPointId: toBackendId(value("accessPointId")),
                },
              },
            });
          }
        }, "Le client a été mis à jour.");
      else
        await runMutation(async () => {
          const result = await createClient({ variables: { input } });
          const client = result.data?.createClient;
          if (!client) {
            throw new Error("La création du client n’a retourné aucun résultat.");
          }

          try {
            await assignIp({
              variables: {
                input: {
                  clientId: toBackendId(client.id),
                  accessPointId: input.accessPointId,
                  networkId: toBackendId(selectedNetwork),
                  ipAddressId: input.ipAddressId,
                },
              },
            });
          } catch (error) {
            setDialog(null);
            const reason =
              error instanceof Error ? ` ${error.message}` : "";
            throw new Error(
              `Le client a été créé, mais l’affectation de l’adresse IP a échoué.${reason}`,
            );
          }
        }, "Le client et son adresse IP ont été créés.");
    } else {
      const input = {
        address: value("address"),
        usageType: value("usageType") as IpUsageType,
        reserved: false,
        active: true,
        networkId: toBackendId(selectedNetwork),
      };
      await runMutation(
        () => createIpAddress({ variables: { input } }),
        "L’adresse IP a été ajoutée.",
      );
    }
  }

  async function removeBase(base: BaseRecord) {
    if (!window.confirm(`Supprimer la base « ${base.name} » ?`)) return;
    await runMutation(async () => {
      await deleteBase({ variables: { id: toBackendId(base.id) } });
      if (selectedBase === base.id) {
        setSelectedBase("");
        setSelectedAccessPoint("");
        setSelectedNetwork("");
      }
    }, "La base a été supprimée.");
  }

  async function removeNetwork(network: NetworkRecord) {
    if (!window.confirm(`Supprimer le réseau ${network.cidr} ?`)) return;
    await runMutation(async () => {
      await deleteNetwork({ variables: { id: toBackendId(network.id) } });
      if (selectedNetwork === network.id) setSelectedNetwork("");
    }, "Le réseau a été supprimé.");
  }

  async function changeStatus(ap: AccessPointRecord) {
    const nextStatus = ap.status === "online" ? "offline" : "online";
    await runMutation(
      () =>
        updateAccessPointStatus({
          variables: { id: toBackendId(ap.id), status: nextStatus },
        }),
      "Le statut du point d’accès a été modifié.",
    );
  }

  const pageTitle = {
    bases: "Sites & équipements",
    networks: "Réseaux",
    clients: "Clients",
    ips: "Inventaire IP",
    map: "Carte géographique",
  }[page];
  const pageDescription = {
    bases: "Gérez vos sites et les points d’accès de l’infrastructure.",
    networks: "Configurez les plages CIDR et suivez leur capacité.",
    clients: "Recherchez et gérez les clients de votre réseau.",
    ips: "Consultez et administrez les adresses de vos sous-réseaux.",
    map: "Visualisez les positions réelles et gérez la géolocalisation.",
  }[page];
  const pageActions: Record<
    Page,
    { label: string; kind: Exclude<DialogState, null>["kind"] }
  > = {
    bases: { label: "Nouvelle base", kind: "base" },
    networks: { label: "Nouveau réseau", kind: "network" },
    clients: { label: "Nouveau client", kind: "client" },
    ips: { label: "Ajouter une IP", kind: "ip" },
    map: { label: "Carte", kind: "base" },
  };

  return (
    <div className="management-workspace">
      <div className="management-topline">
        <div>
          <div className="page-kicker">
            <span className="kicker-line" /> GESTION OPÉRATIONNELLE
          </div>
          <h1>
            {pageTitle}
            <span className="heading-period">.</span>
          </h1>
          <p>{pageDescription}</p>
        </div>
        <div className="management-top-actions">
          <span
            className={`api-inline ${healthQuery.error ? "is-offline" : ""}`}
          >
            <i />
            {healthQuery.data?.health
              ? "API et base connectées"
              : healthQuery.error
                ? "API indisponible"
                : "Connexion…"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("overview")}
          >
            <MapPin size={14} /> Vue d’ensemble
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refreshData()}
            disabled={healthQuery.loading || basesQuery.loading}
          >
            <LoaderCircle
              size={14}
              className={
                healthQuery.loading || basesQuery.loading ? "animate-spin" : ""
              }
            />{" "}
            Actualiser
          </Button>
        </div>
      </div>

      {page !== "map" && (
      <Card className="scope-toolbar">
        <label className="scope-select">
          <span>BASE</span>
          <SelectInput
            value={selectedBase}
            onChange={(event) => setSelectedBase(event.target.value)}
          >
            <option value="">Sélectionner une base</option>
            {bases.map((base) => (
              <option key={base.id} value={base.id}>
                {base.name}
              </option>
            ))}
          </SelectInput>
          <ChevronDown size={14} />
        </label>
        <span className="scope-divider" />
        <label className="scope-select">
          <span>POINT D’ACCÈS</span>
          <SelectInput
            value={selectedAccessPoint}
            onChange={(event) => setSelectedAccessPoint(event.target.value)}
            disabled={!accessPoints.length}
          >
            <option value="">
              {accessPoints.length
                ? "Sélectionner un point"
                : "Aucun point disponible"}
            </option>
            {accessPoints.map((ap) => (
              <option key={ap.id} value={ap.id}>
                {ap.name}
              </option>
            ))}
          </SelectInput>
          <ChevronDown size={14} />
        </label>
        <span className="scope-divider" />
        <label className="scope-select">
          <span>RÉSEAU</span>
          <SelectInput
            value={selectedNetwork}
            onChange={(event) => setSelectedNetwork(event.target.value)}
            disabled={!networks.length}
          >
            <option value="">
              {networks.length
                ? "Sélectionner un réseau"
                : "Aucun réseau disponible"}
            </option>
            {networks.map((network) => (
              <option key={network.id} value={network.id}>
                {network.cidr}
              </option>
            ))}
          </SelectInput>
          <ChevronDown size={14} />
        </label>
      </Card>
      )}

      {notice && !dialog && (
        <div
          className={`operation-notice ${notice.kind === "error" ? "notice-error" : "notice-success"}`}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          <span>
            {notice.kind === "error" ? (
              <AlertTriangle size={15} />
            ) : (
              <Check size={15} />
            )}
          </span>
          {notice.message}
          <button
            aria-label="Fermer le message"
            type="button"
            onClick={() => setNotice(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {queryError && (
        <div className="api-alert" role="alert">
          <AlertTriangle size={16} />
          <span>
            <strong>Impossible de charger les données.</strong>{" "}
            {queryError.message}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => void refreshData()}
          >
            Réessayer
          </Button>
        </div>
      )}

      <div
        className="management-tabs"
        role="tablist"
        aria-label="Domaines de gestion"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={page === id}
            className={`management-tab ${page === id ? "active" : ""}`}
            onClick={() => {
              setPage(id);
              setSearch("");
            }}
            type="button"
          >
            <Icon size={15} />
            {label}
            <span>
              {id === "bases"
                ? bases.length
                : id === "networks"
                  ? networks.length
                  : id === "ips"
                    ? (networkStats?.totalIps ?? "—")
                    : "⌕"}
            </span>
          </button>
        ))}
      </div>

      {page === "map" ? (
        <GeolocationWorkspace />
      ) : (
      <>
      {page === "ips" && selectedNetwork && (
        <div className="inventory-summary">
          <div>
            <span>Total</span>
            <strong>{networkStats?.totalIps ?? "—"}</strong>
          </div>
          <div>
            <span>Disponibles</span>
            <strong>{networkStats?.freeIps ?? "—"}</strong>
          </div>
          <div>
            <span>Attribuées</span>
            <strong>{networkStats?.occupiedIps ?? "—"}</strong>
          </div>
          <div>
            <span>Réservées</span>
            <strong>{networkStats?.reservedIps ?? "—"}</strong>
          </div>
          <div>
            <span>Retirées</span>
            <strong>{networkStats?.decommissionedIps ?? "—"}</strong>
          </div>
        </div>
      )}

      <Card className="management-table-card">
        <div className="management-table-toolbar">
          <div>
            <strong>
              {page === "bases"
                ? `${filteredBases.length} base${filteredBases.length === 1 ? "" : "s"}`
                : page === "networks"
                  ? `${filteredNetworks.length} réseau${filteredNetworks.length === 1 ? "" : "x"}`
                  : page === "clients"
                    ? `${filteredClients.length} client${filteredClients.length === 1 ? "" : "s"}`
                    : `${filteredIps.length} adresse${filteredIps.length === 1 ? "" : "s"}`}
            </strong>
            <span>
              {selectedBase
                ? bases.find((base) => base.id === selectedBase)?.name
                : "Sélectionnez un site pour consulter ses équipements"}
            </span>
          </div>
          <div className="table-tools">
            <label className="manage-search">
              <Search size={14} />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  if (page === "clients") setClientSearch(event.target.value);
                }}
                placeholder={
                  page === "clients"
                    ? "Nom ou téléphone…"
                    : "Filtrer les résultats…"
                }
                aria-label="Filtrer les résultats"
              />
            </label>
            <Button
              size="sm"
              className="add-button"
              disabled={
                (page === "networks" && !selectedAccessPoint) ||
                (page === "ips" && !selectedNetwork) ||
                (page === "clients" && !selectedAccessPoint)
              }
              onClick={() =>
                setDialog({ kind: pageActions[page].kind } as DialogState)
              }
            >
              <Plus size={14} />
              {pageActions[page].label}
            </Button>
            {page === "bases" && selectedBase && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialog({ kind: "accessPoint" })}
              >
                <CirclePlus size={14} />
                Point d’accès
              </Button>
            )}
          </div>
        </div>

        {page === "bases" && (
          <div className="table-scroll">
            <table className="management-table">
              <thead>
                <tr>
                  <th>SITE</th>
                  <th>LOCALISATION</th>
                  <th>STATUT</th>
                  <th>POINTS D’ACCÈS</th>
                  <th className="actions-col">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {basesQuery.loading && !bases.length && (
                  <RowsLoading columns={5} />
                )}
                {filteredBases.map((base) => (
                  <tr key={base.id}>
                    <td>
                      <strong>{base.name}</strong>
                      <small className="record-id">{base.id}</small>
                    </td>
                    <td>
                      <span className="location-cell">
                        <MapPin size={13} />
                        {base.location}
                      </span>
                    </td>
                    <td>
                      <Status value={base.status} />
                    </td>
                    <td>
                      {base.id === selectedBase ? accessPoints.length : "—"}
                    </td>
                    <td className="row-actions">
                      <button
                        title="Modifier"
                        aria-label={`Modifier ${base.name}`}
                        onClick={() =>
                          setDialog({ kind: "base", record: base })
                        }
                        type="button"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="danger-action"
                        title="Supprimer"
                        aria-label={`Supprimer ${base.name}`}
                        onClick={() => void removeBase(base)}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!basesQuery.loading && !filteredBases.length && (
                  <EmptyRow
                    columns={5}
                    text={
                      search
                        ? "Aucune base ne correspond au filtre."
                        : "Aucune base enregistrée. Créez votre premier site."
                    }
                  />
                )}
                {accessPoints.map((ap) => (
                  <tr key={ap.id} className="child-record">
                    <td>
                      <span className="child-indent">
                        <Wifi size={14} />
                        {ap.name}
                      </span>
                      <small className="record-id">Secteur {ap.sector}</small>
                    </td>
                    <td>Point d’accès</td>
                    <td>
                      <button
                        className="status-action"
                        type="button"
                        onClick={() => void changeStatus(ap)}
                      >
                        <Status value={ap.status} />
                      </button>
                    </td>
                    <td>
                      {ap.azimuth != null ? `${ap.azimuth}° azimut` : "—"}
                    </td>
                    <td className="row-actions">
                      <span className="quiet-text">ID {ap.id.slice(0, 9)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {page === "networks" && (
          <div className="table-scroll">
            <table className="management-table">
              <thead>
                <tr>
                  <th>PLAGE CIDR</th>
                  <th>ADRESSE RÉSEAU</th>
                  <th>VLAN</th>
                  <th>CAPACITÉ</th>
                  <th>TYPE</th>
                  <th className="actions-col">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {networksQuery.loading && !networks.length && (
                  <RowsLoading columns={6} />
                )}
                {filteredNetworks.map((network) => (
                  <tr key={network.id}>
                    <td>
                      <strong className="mono-value">{network.cidr}</strong>
                      <small className="record-id">
                        Passerelle {network.gateway}
                      </small>
                    </td>
                    <td className="mono-value">{network.networkAddress}</td>
                    <td>
                      <span className="vlan-chip">{network.vlan}</span>
                    </td>
                    <td>{network.totalHosts.toLocaleString("fr-FR")} hôtes</td>
                    <td>
                      <Badge tone={network.isPrivate ? "green" : "amber"}>
                        {network.isPrivate ? "Privé" : "Public"}
                      </Badge>
                    </td>
                    <td className="row-actions">
                      <button
                        className="danger-action"
                        title="Supprimer le réseau"
                        aria-label={`Supprimer ${network.cidr}`}
                        onClick={() => void removeNetwork(network)}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!networksQuery.loading && !filteredNetworks.length && (
                  <EmptyRow
                    columns={6}
                    text={
                      !selectedAccessPoint
                        ? "Sélectionnez un point d’accès pour afficher ses réseaux."
                        : "Aucun réseau configuré pour ce point d’accès."
                    }
                  />
                )}
              </tbody>
            </table>
          </div>
        )}

        {page === "clients" && (
          <div className="table-scroll">
            <table className="management-table">
              <thead>
                <tr>
                  <th>CLIENT</th>
                  <th>TÉLÉPHONE</th>
                  <th>TYPE</th>
                  <th>ADRESSE IP</th>
                  <th>POINT D’ACCÈS</th>
                  <th className="actions-col">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(clientsQuery.loading || clientsByAccessPointQuery.loading) &&
                  !clients.length && <RowsLoading columns={6} />}
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <strong>{client.fullName}</strong>
                      <small className="record-id">{client.id}</small>
                    </td>
                    <td>{client.phoneNumber}</td>
                    <td>
                      <Badge tone="gray">{client.clientType}</Badge>
                    </td>
                    <td className="mono-value">
                      {client.ipAddressId.slice(0, 12)}
                    </td>
                    <td>
                      {accessPoints.find((ap) => ap.id === client.accessPointId)
                        ?.name ?? client.accessPointId.slice(0, 12)}
                    </td>
                    <td className="row-actions">
                      <button
                        title="Modifier"
                        aria-label={`Modifier ${client.fullName}`}
                        onClick={() =>
                          setDialog({ kind: "client", record: client })
                        }
                        type="button"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="danger-action"
                        title="Supprimer"
                        aria-label={`Supprimer ${client.fullName}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Supprimer le client ${client.fullName} ?`,
                            )
                          )
                            void runMutation(
                              () =>
                                deleteClient({
                                  variables: { id: toBackendId(client.id) },
                                }),
                              "Le client a été supprimé.",
                            );
                        }}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!clientsQuery.loading && !filteredClients.length && (
                  <EmptyRow
                    columns={6}
                    text={
                      clientSearch.trim()
                        ? "Aucun client trouvé."
                        : "Saisissez un nom ou un numéro de téléphone dans la recherche."
                    }
                  />
                )}
              </tbody>
            </table>
          </div>
        )}

        {page === "ips" && (
          <div className="table-scroll">
            <table className="management-table">
              <thead>
                <tr>
                  <th>ADRESSE IP</th>
                  <th>STATUT</th>
                  <th>USAGE</th>
                  <th>RÉSERVATION</th>
                  <th>ACTIVITÉ</th>
                  <th className="actions-col">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {ipsQuery.loading && !ips.length && <RowsLoading columns={6} />}
                {filteredIps.map((ip) => (
                  <tr key={ip.id}>
                    <td>
                      <strong className="mono-value">{ip.address}</strong>
                      <small className="record-id">{ip.id}</small>
                    </td>
                    <td>
                      <Status value={ip.status} />
                    </td>
                    <td>
                      <Badge tone="gray">{ip.usageType}</Badge>
                    </td>
                    <td>
                      {ip.reserved ? (
                        <span className="yes-reserved">Oui</span>
                      ) : (
                        "Non"
                      )}
                    </td>
                    <td>
                      {ip.active ? (
                        <span className="active-indicator">Active</span>
                      ) : (
                        "Inactive"
                      )}
                    </td>
                    <td className="row-actions">
                      {ip.status === "free" && (
                        <button
                          title="Réserver"
                          aria-label={`Réserver ${ip.address}`}
                          onClick={() =>
                            void runMutation(
                              () =>
                                reserveIp({
                                  variables: {
                                    input: {
                                      ipAddressId: toBackendId(ip.id),
                                      usageType: ip.usageType,
                                    },
                                  },
                                }),
                              "L’adresse a été réservée.",
                            )
                          }
                          type="button"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {ip.status === "occupied" && (
                        <button
                          title="Libérer"
                          aria-label={`Libérer ${ip.address}`}
                          onClick={() =>
                            void runMutation(
                              () =>
                                releaseIp({
                                  variables: {
                                    ipAddressId: toBackendId(ip.id),
                                  },
                                }),
                              "L’adresse a été libérée.",
                            )
                          }
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      )}
                      {ip.status !== "decommissioned" && (
                        <button
                          className="danger-action"
                          title="Retirer"
                          aria-label={`Retirer ${ip.address}`}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Retirer définitivement ${ip.address} ?`,
                              )
                            )
                              void runMutation(
                                () =>
                                  decommissionIp({
                                    variables: {
                                      input: {
                                        ipAddressId: toBackendId(ip.id),
                                      },
                                    },
                                  }),
                                "L’adresse a été retirée.",
                              );
                          }}
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!ipsQuery.loading && !filteredIps.length && (
                  <EmptyRow
                    columns={6}
                    text={
                      !selectedNetwork
                        ? "Sélectionnez un réseau pour afficher son inventaire."
                        : "Aucune adresse trouvée dans ce réseau."
                    }
                  />
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="management-table-footer">
          <span>
            API GraphQL <code>/graphql</code>
          </span>
          <span>Actualisation automatique au changement de sélection</span>
        </div>
      </Card>

      <div className="management-note">
        <Signal size={15} />
        <span>
          Les écritures sont persistées par l’API. Les erreurs de validation
          GraphQL s’affichent ici après la soumission.
        </span>
      </div>
      </>
      )}

      {dialog && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section
            className="create-dialog manage-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-dialog-title"
          >
            <div className="dialog-heading">
              <span className="dialog-icon">
                <Network size={18} />
              </span>
              <button
                className="dialog-close"
                type="button"
                aria-label="Fermer"
                onClick={() => setDialog(null)}
              >
                ×
              </button>
              <div className="section-overline">GESTION OPÉRATIONNELLE</div>
              <h2 id="manage-dialog-title">
                {dialog.kind === "base"
                  ? dialog.record
                    ? "Modifier la base"
                    : "Nouvelle base"
                  : dialog.kind === "accessPoint"
                    ? "Nouveau point d’accès"
                    : dialog.kind === "network"
                      ? "Nouveau réseau"
                      : dialog.kind === "client"
                        ? dialog.record
                          ? "Modifier le client"
                          : "Nouveau client"
                        : "Ajouter une adresse IP"}
              </h2>
              <p>Les champs marqués sont requis pour la mutation.</p>
            </div>
            <form
              className="dialog-form manage-form"
              onSubmit={(event) => void handleSubmit(event)}
            >
              {dialog.kind === "base" && (
                <>
                  <Field label="Nom de la base">
                    <TextInput
                      name="name"
                      required
                      maxLength={120}
                      defaultValue={dialog.record?.name}
                      placeholder="Ex. Site central"
                    />
                  </Field>
                  <Field label="Localisation">
                    <TextInput
                      name="location"
                      required
                      maxLength={200}
                      defaultValue={dialog.record?.location}
                      placeholder="Ex. Dakar, Sénégal"
                    />
                  </Field>
                  <Field label="Statut">
                    <SelectInput
                      name="status"
                      defaultValue={dialog.record?.status ?? "active"}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </SelectInput>
                  </Field>
                </>
              )}
              {dialog.kind === "accessPoint" && (
                <>
                  <Field label="Nom">
                    <TextInput
                      name="name"
                      required
                      placeholder="Ex. Antenne Nord"
                    />
                  </Field>
                  <Field label="IP de management">
                    <TextInput
                      name="managementIpId"
                      required
                      placeholder="UUID de l’adresse IP de management"
                    />
                  </Field>
                  <Field label="Secteur">
                    <TextInput
                      name="sector"
                      required
                      placeholder="Ex. Secteur A"
                    />
                  </Field>
                  <Field label="Statut">
                    <SelectInput name="status" defaultValue="online">
                      <option value="online">En ligne</option>
                      <option value="offline">Hors ligne</option>
                      <option value="maintenance">Maintenance</option>
                    </SelectInput>
                  </Field>
                </>
              )}
              {dialog.kind === "network" && (
                <>
                  <Field label="CIDR">
                    <TextInput
                      name="cidr"
                      value={networkCidr}
                      onChange={(event) => setNetworkCidr(event.target.value)}
                      required
                      pattern="(?:25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])(?:\.(?:25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])){3}\/(?:[0-9]|[12][0-9]|3[0-2])"
                      placeholder="192.168.10.0/24"
                    />
                  </Field>
                  <Field label="Passerelle">
                    <TextInput
                      name="gateway"
                      required
                      placeholder="192.168.10.1"
                    />
                  </Field>
                  <Field label="VLAN">
                    <TextInput
                      name="vlan"
                      type="number"
                      min="1"
                      max="4094"
                      required
                      placeholder="100"
                    />
                  </Field>
                  <SubnetPreview
                    cidr={networkCidr}
                    query={subnetQuery}
                    onCalculate={(cidr) =>
                      calculateSubnet({ variables: { cidr } })
                    }
                  />
                </>
              )}
              {dialog.kind === "client" && (
                <>
                  <Field label="Nom complet">
                    <TextInput
                      name="fullName"
                      required
                      defaultValue={dialog.record?.fullName}
                      placeholder="Nom du client"
                    />
                  </Field>
                  <Field label="Téléphone">
                    <TextInput
                      name="phoneNumber"
                      required
                      defaultValue={dialog.record?.phoneNumber}
                      placeholder="+221 77 000 00 00"
                    />
                  </Field>
                  <Field label="Type de client">
                    <SelectInput
                      name="clientType"
                      defaultValue={dialog.record?.clientType ?? "residential"}
                    >
                      <option value="residential">Résidentiel</option>
                      <option value="business">Professionnel</option>
                      <option value="enterprise">Entreprise</option>
                      <option value="iot">IoT</option>
                    </SelectInput>
                  </Field>
                  {dialog.record && (
                    <Field label="Point d’accès">
                      <SelectInput
                        name="accessPointId"
                        defaultValue={dialog.record.accessPointId}
                      >
                        {accessPoints.map((ap) => (
                          <option key={ap.id} value={ap.id}>
                            {ap.name}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  )}
                  {!dialog.record && (
                    <Field label="Adresse IP disponible">
                      <SelectInput
                        name="ipAddressId"
                        required
                        defaultValue=""
                        disabled={availableIpsQuery.loading || !!availableIpsQuery.error}
                      >
                        <option value="">Sélectionner une IP</option>
                        {availableIpsQuery.loading && (
                          <option disabled>Chargement des adresses IP…</option>
                        )}
                        {availableIpsQuery.error && (
                          <option disabled>
                            Impossible de charger les adresses disponibles.
                          </option>
                        )}
                        {!availableIpsQuery.loading &&
                          !availableIpsQuery.error &&
                          !availableIps.length && (
                            <option disabled>
                              Aucune adresse IP disponible sur ce réseau.
                            </option>
                          )}
                        {availableIps.map((ip) => (
                          <option key={ip.id} value={toBackendId(ip.id)}>
                            {ip.address}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  )}
                </>
              )}
              {dialog.kind === "ip" && (
                <>
                  <Field label="Adresse">
                    <TextInput
                      name="address"
                      required
                      placeholder="192.168.10.25"
                    />
                  </Field>
                  <Field label="Type d’usage">
                    <SelectInput name="usageType" defaultValue="infrastructure">
                      <option value="infrastructure">Infrastructure</option>
                      <option value="management">Management</option>
                      <option value="client">Client</option>
                    </SelectInput>
                  </Field>
                  <p className="quiet-text">
                    Une nouvelle adresse est créée disponible. Vous pourrez
                    ensuite la réserver, la libérer ou la retirer depuis
                    l’inventaire.
                  </p>
                </>
              )}
              {notice?.kind === "error" && (
                <p className="dialog-error" role="alert">
                  {notice.message}
                </p>
              )}
              <div className="dialog-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialog(null)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    (dialog.kind === "client" &&
                      !dialog.record &&
                      (availableIpsQuery.loading ||
                        !!availableIpsQuery.error ||
                        !availableIps.length))
                  }
                >
                  {loading ? (
                    <>
                      <LoaderCircle size={14} className="animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function RowsLoading({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 3 }, (_, row) => (
        <tr key={`loading-${row}`}>
          {Array.from({ length: columns }, (_, column) => (
            <td key={`loading-${row}-${column}`}>
              <span className="skeleton h-4 w-24" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyRow({ columns, text }: { columns: number; text: string }) {
  return (
    <tr>
      <td className="management-empty" colSpan={columns}>
        <span>
          <Network size={19} />
          {text}
        </span>
      </td>
    </tr>
  );
}

function SubnetPreview({
  cidr,
  query,
  onCalculate,
}: {
  cidr: string;
  query: {
    data?: CalculateSubnetQueryResult;
    error?: Error;
  };
  onCalculate: (cidr: string) => unknown;
}) {
  const [preview, setPreview] = useState(false);
  const info = query.data?.calculateSubnet;
  return (
    <div className="subnet-tool">
      <div className="subnet-tool-heading">
        <Signal size={14} /> Vérifier la plage CIDR avant création
      </div>
      <div className="subnet-tool-input">
        <span className="subnet-entered-value">
          {cidr || "Saisissez un CIDR ci-dessus"}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setPreview(true);
            if (cidr) void onCalculate(cidr);
          }}
          disabled={!cidr}
        >
          Calculer
        </Button>
      </div>
      {preview && info && (
        <div className="subnet-result">
          <span>{info.networkAddress}</span>
          <span>{info.totalHosts.toLocaleString("fr-FR")} hôtes</span>
          <span>Masque {info.subnetMask}</span>
          <span>
            {info.usableStart} – {info.usableEnd}
          </span>
        </div>
      )}
      {preview && query.error && (
        <span className="dialog-error">
          CIDR invalide ou erreur du serveur.
        </span>
      )}
    </div>
  );
}
