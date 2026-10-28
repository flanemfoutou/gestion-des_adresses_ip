'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  ChevronDown,
  CircleHelp,
  Command,
  ExternalLink,
  Globe2,
  LayoutDashboard,
  MapPin,
  MoreHorizontal,
  Network,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Signal,
  UserRound,
  Wifi,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkspacePage } from '@/app/page';

const DASHBOARD_QUERY = gql`
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
`;

const CREATE_BASE_MUTATION = gql`
  mutation CreateBase($input: CreateBaseInput!) {
    createBase(input: $input) {
      id
      name
      location
      status
    }
  }
`;

type DashboardData = {
  health: string;
  globalIpStats: {
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
  listBases: Array<{ id: string; name: string; location: string; status: string }>;
};

const navigation: Array<{ label: string; href: string; icon: typeof LayoutDashboard; page: WorkspacePage }> = [
  { label: 'Vue d’ensemble', href: '#overview', icon: LayoutDashboard, page: 'overview' },
  { label: 'Sites & équipements', href: '#sites', icon: MapPin, page: 'bases' },
  { label: 'Réseaux', href: '#inventory', icon: Network, page: 'networks' },
  { label: 'Clients', href: '#clients', icon: UserRound, page: 'clients' },
  { label: 'Adresses IP', href: '#ips', icon: Globe2, page: 'ips' },
];

const numberFormat = new Intl.NumberFormat('fr-FR');

function formatNumber(value: number | undefined) {
  return numberFormat.format(value ?? 0);
}

function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  trend,
  accent,
  loading,
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof Globe2;
  trend?: 'up' | 'down';
  accent: string;
  loading: boolean;
}) {
  return (
    <Card className="stat-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="eyebrow">{label}</span>
          <span className={`stat-icon ${accent}`}><Icon size={17} strokeWidth={1.8} /></span>
        </div>
        <div className="mt-5 flex items-end justify-between gap-2">
          {loading ? <span className="skeleton h-9 w-24" /> : <span className="stat-value">{value}</span>}
          {trend && (
            <span className={`trend ${trend}`}>
              {trend === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              En temps réel
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">{caption}</p>
      </CardContent>
    </Card>
  );
}

export function Dashboard({ onNavigate }: { onNavigate: (page: WorkspacePage) => void }) {
  const { data, loading, error, refetch, networkStatus } = useQuery<DashboardData>(DASHBOARD_QUERY, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    pollInterval: 60_000,
  });
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [baseName, setBaseName] = useState('');
  const [baseLocation, setBaseLocation] = useState('');
  const [createBase, { loading: creatingBase, error: createError }] = useMutation(CREATE_BASE_MUTATION, {
    refetchQueries: [{ query: DASHBOARD_QUERY }],
    awaitRefetchQueries: true,
  });
  const stats = data?.globalIpStats;
  const bases = data?.listBases ?? [];
  const filteredBases = useMemo(
    () => bases.filter((base) => `${base.name} ${base.location}`.toLowerCase().includes(search.toLowerCase())),
    [bases, search],
  );
  const utilization = Math.max(0, Math.min(100, stats?.utilizationPercentage ?? 0));
  const connected = Boolean(data?.health);

  async function handleCreateBase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createBase({ variables: { input: { name: baseName.trim(), location: baseLocation.trim(), status: 'active' } } });
      setCreateOpen(false);
      setBaseName('');
      setBaseLocation('');
    } catch {
      return;
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Cambium, accueil">
          <span className="brand-mark"><Command size={19} strokeWidth={2.4} /></span>
          <span className="brand-copy"><strong>cambium</strong><small>NETWORK CONTROL</small></span>
          <ChevronDown className="brand-chevron" size={15} />
        </a>

        <div className="workspace-label">ESPACE DE TRAVAIL</div>
        <nav className="side-nav" aria-label="Navigation principale">
          {navigation.map(({ label, href, icon: Icon, page }, index) => (
            <a key={href} className={`nav-link ${index === 0 ? 'selected' : ''}`} href={href} onClick={(event) => { if (page !== 'overview') { event.preventDefault(); onNavigate(page); } }}>
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {page === 'bases' && <span className="nav-count">{bases.length || '—'}</span>}
            </a>
          ))}
        </nav>

        <div className="workspace-label infra-label">INFRASTRUCTURE</div>
        <div className="infra-list">
          <a className="nav-link" href="#sites" onClick={(event) => { event.preventDefault(); onNavigate('bases'); }}><Server size={17} strokeWidth={1.8} /><span>Points d’accès</span></a>
          <a className="nav-link" href="#inventory"><Boxes size={17} strokeWidth={1.8} /><span>Réseaux & VLAN</span></a>
          <a className="nav-link" href="#inventory"><Signal size={17} strokeWidth={1.8} /><span>Qualité du signal</span></a>
        </div>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><CircleHelp size={17} /></div>
            <div><strong>Besoin d’aide ?</strong><span>Consulter la documentation</span></div>
            <ExternalLink size={14} className="help-external" />
          </div>
          <button className="profile-row" type="button">
            <span className="avatar">AD</span>
            <span className="profile-copy"><strong>Administrateur</strong><small>Équipe réseau</small></span>
            <MoreHorizontal size={18} className="profile-more" />
          </button>
        </div>
      </aside>

      <main className="main-panel" id="overview">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>Vue d’ensemble</strong></div>
          <div className="topbar-actions">
            <div className={`connection-pill ${connected ? 'is-online' : error ? 'is-offline' : ''}`}>
              <span className="connection-dot" />
              {connected ? 'API connectée' : error ? 'API indisponible' : 'Connexion…'}
            </div>
            <span className="topbar-divider" />
            <button className="icon-button" aria-label="Paramètres" title="Paramètres" type="button"><Settings2 size={17} /></button>
            <span className="avatar top-avatar">AD</span>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="page-kicker"><span className="kicker-line" /> CENTRE DE CONTRÔLE</div>
              <h1>Vue d’ensemble<span className="heading-period">.</span></h1>
              <p>Votre infrastructure réseau, en un seul endroit.</p>
            </div>
            <div className="heading-actions">
              <span className="last-updated"><span className="live-pulse" />Actualisation automatique</span>
              <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={networkStatus === 4} aria-label="Actualiser les données">
                <RefreshCw size={14} className={networkStatus === 4 ? 'animate-spin' : ''} />
                Actualiser
              </Button>
            </div>
          </section>

          {error && (
            <div className="api-alert" role="status">
              <span className="api-alert-icon"><Activity size={16} /></span>
              <span><strong>Impossible de joindre l’API GraphQL.</strong> Vérifiez qu’elle fonctionne sur le port 4000.</span>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => void refetch()}>Réessayer</Button>
            </div>
          )}

          <section className="stats-grid" aria-label="Statistiques réseau">
            <StatCard label="Adresses IP" value={formatNumber(stats?.totalIps)} caption="Capacité totale provisionnée" icon={Globe2} accent="stat-sage" loading={loading && !stats} />
            <StatCard label="Adresses utilisées" value={formatNumber(stats?.totalUsedIps)} caption="Assignées à vos clients" icon={Activity} accent="stat-orange" trend="up" loading={loading && !stats} />
            <StatCard label="Disponibles" value={formatNumber(stats?.totalFreeIps)} caption="Prêtes à être attribuées" icon={ShieldCheck} accent="stat-lime" loading={loading && !stats} />
            <StatCard label="Réseaux actifs" value={formatNumber(stats?.totalNetworks)} caption={`${formatNumber(stats?.privateNetworksCount)} privés · ${formatNumber(stats?.publicNetworksCount)} publics`} icon={Network} accent="stat-blue" loading={loading && !stats} />
          </section>

          <section className="overview-grid" aria-label="Résumé de la capacité IP">
            <Card className="utilization-card" id="inventory">
              <CardHeader className="section-card-heading">
                <div><div className="section-overline">CAPACITÉ GLOBALE</div><CardTitle>Utilisation des adresses</CardTitle></div>
                <button className="subtle-icon" type="button" aria-label="Plus d’options"><MoreHorizontal size={19} /></button>
              </CardHeader>
              <CardContent className="utilization-content">
                <div className="donut-wrap">
                  <div className="donut" style={{ '--usage': `${utilization}%` } as React.CSSProperties}>
                    <div className="donut-center"><strong>{loading && !stats ? '—' : `${utilization.toFixed(1).replace('.', ',')}%`}</strong><span>UTILISÉ</span></div>
                  </div>
                </div>
                <div className="utilization-details">
                  <p className="utilization-description">Capacité de votre infrastructure IP sur l’ensemble des sous-réseaux.</p>
                  <div className="legend-list">
                    <div className="legend-row"><span className="legend-label"><i className="legend-dot used-dot" />Utilisées</span><strong>{formatNumber(stats?.totalUsedIps)} <small>IP</small></strong></div>
                    <div className="legend-row"><span className="legend-label"><i className="legend-dot free-dot" />Disponibles</span><strong>{formatNumber(stats?.totalFreeIps)} <small>IP</small></strong></div>
                    <div className="legend-row"><span className="legend-label"><i className="legend-dot reserved-dot" />Réservées</span><strong>{formatNumber(stats?.totalReservedIps)} <small>IP</small></strong></div>
                  </div>
                  <div className="utilization-footnote"><ShieldCheck size={14} /> Capacité moyenne : <strong>{formatNumber(stats?.averageSubnetSize)} hôtes</strong> par sous-réseau</div>
                </div>
              </CardContent>
            </Card>

            <Card className="network-card">
              <CardHeader className="section-card-heading">
                <div><div className="section-overline">VOTRE INFRASTRUCTURE</div><CardTitle>Répartition des réseaux</CardTitle></div>
                <span className="network-card-icon"><Wifi size={17} /></span>
              </CardHeader>
              <CardContent>
                <div className="network-total"><strong>{formatNumber(stats?.totalNetworks)}</strong><span>réseaux configurés</span></div>
                <div className="network-bar" role="img" aria-label={`${formatNumber(stats?.privateNetworksCount)} réseaux privés et ${formatNumber(stats?.publicNetworksCount)} réseaux publics`}>
                  <span className="private-bar" style={{ width: `${stats?.totalNetworks ? (stats.privateNetworksCount / stats.totalNetworks) * 100 : 0}%` }} />
                  <span className="public-bar" />
                </div>
                <div className="network-breakdown">
                  <div><span className="breakdown-dot private-dot" /><span>Privés</span><strong>{formatNumber(stats?.privateNetworksCount)}</strong></div>
                  <div><span className="breakdown-dot public-dot" /><span>Publics</span><strong>{formatNumber(stats?.publicNetworksCount)}</strong></div>
                </div>
                <div className="network-footnote"><span className="network-footnote-icon"><ShieldCheck size={15} /></span><span><strong>Protection active</strong><small>Vos plages réseau sont surveillées.</small></span><ArrowUpRight size={15} className="footnote-arrow" /></div>
              </CardContent>
            </Card>
          </section>

          <section id="sites" className="sites-section">
            <div className="section-heading-row">
              <div><div className="section-overline">VUE TERRAIN</div><h2>Sites & bases</h2><p>{formatNumber(bases.length)} site{bases.length > 1 ? 's' : ''} enregistré{bases.length > 1 ? 's' : ''} dans votre infrastructure.</p></div>
              <div className="sites-actions">
                <label className="search-box"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un site…" aria-label="Rechercher un site" /></label>
                <Button size="sm" className="add-button" onClick={() => setCreateOpen(true)}><Plus size={15} />Nouvelle base</Button>
              </div>
            </div>

            <Card className="sites-table-card">
              <div className="table-scroll">
                <table className="sites-table">
                  <thead><tr><th>BASE / SITE</th><th>LOCALISATION</th><th>ÉTAT</th><th className="table-action-heading">DÉTAILS</th></tr></thead>
                  <tbody>
                    {loading && bases.length === 0 && Array.from({ length: 3 }, (_, index) => (
                      <tr key={`loading-${index}`}><td><span className="skeleton h-4 w-36" /></td><td><span className="skeleton h-4 w-28" /></td><td><span className="skeleton h-6 w-20 rounded-md" /></td><td /></tr>
                    ))}
                    {!loading && filteredBases.map((base, index) => {
                      const active = base.status.toLowerCase() === 'active';
                      return (
                        <tr key={base.id}>
                          <td><div className="base-cell"><span className={`base-marker marker-${index % 4}`}><MapPin size={15} /></span><span><strong>{base.name}</strong><small>BASE-{String(index + 1).padStart(3, '0')}</small></span></div></td>
                          <td><span className="location-cell"><MapPin size={13} />{base.location}</span></td>
                          <td><Badge tone={active ? 'green' : base.status.toLowerCase() === 'maintenance' ? 'amber' : 'gray'}><span className="status-dot" />{active ? 'Opérationnelle' : base.status === 'maintenance' ? 'Maintenance' : 'Inactive'}</Badge></td>
                          <td className="table-action-cell"><button className="row-action" type="button" aria-label={`Détails de ${base.name}`} title={`Identifiant : ${base.id}`}><MoreHorizontal size={18} /></button></td>
                        </tr>
                      );
                    })}
                    {!loading && filteredBases.length === 0 && <tr><td colSpan={4} className="empty-state">{search ? 'Aucun site ne correspond à votre recherche.' : 'Aucune base enregistrée pour le moment.'}</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="table-footer"><span>Affichage de <strong>{filteredBases.length}</strong> site{filteredBases.length > 1 ? 's' : ''}</span><a href="#inventory">Vue de l’infrastructure <ArrowUpRight size={13} /></a></div>
            </Card>
          </section>

          <footer className="page-footer"><span>CAMBIUM NETWORK CONTROL <span className="footer-separator">·</span> IPAM</span><span>Supervision réseau <span className="footer-online">●</span></span></footer>
        </div>
      </main>

      {createOpen && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
          <section className="create-dialog" role="dialog" aria-modal="true" aria-labelledby="create-base-title">
            <div className="dialog-heading">
              <span className="dialog-icon"><MapPin size={18} /></span>
              <button className="dialog-close" type="button" aria-label="Fermer" onClick={() => setCreateOpen(false)}>×</button>
              <div className="section-overline">INFRASTRUCTURE</div>
              <h2 id="create-base-title">Nouvelle base</h2>
              <p>Ajoutez un site à votre infrastructure réseau.</p>
            </div>
            <form className="dialog-form" onSubmit={handleCreateBase}>
              <label htmlFor="base-name">Nom de la base</label>
              <input id="base-name" autoFocus required maxLength={120} value={baseName} onChange={(event) => setBaseName(event.target.value)} placeholder="Ex. Site central" />
              <label htmlFor="base-location">Localisation</label>
              <input id="base-location" required maxLength={200} value={baseLocation} onChange={(event) => setBaseLocation(event.target.value)} placeholder="Ex. Dakar, Sénégal" />
              {createError && <p className="dialog-error" role="alert">La création a échoué. Vérifiez les informations et la connexion à l’API.</p>}
              <div className="dialog-actions">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={creatingBase}>{creatingBase ? 'Création…' : 'Créer la base'}</Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
