import { v4 as uuidv4 } from 'uuid';
import type { NetworkIpStats } from '@/application/ports/repositories';
import { GraphQLError } from 'graphql';
import { CoordinatesSchema } from '@/application/dtos/CoordinatesDTO';
import { Base } from '@/domain/base/Base';
import { AccessPoint } from '@/domain/accessPoint/AccessPoint';
import { Network } from '@/domain/network/Network';
import { Client } from '@/domain/client/Client';
import { IpAddress } from '@/domain/ipAddress/IpAddress';
import { IpCalculatorService } from '@/domain/network/IpCalculatorService';
import { sql } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';

// Normalize incoming IDs: if prefixed like 'bas<uuid>' return the raw uuid
function normalizeId(id: any): string | undefined {
  if (!id) return id;
  const s = id.toString();
  if (s.length === 36) return s;
  if (s.length > 36) return s.slice(-36);
  return s;
}

function validateCoordinates(input: unknown) {
  const result = CoordinatesSchema.safeParse(input);
  if (!result.success) {
    throw new GraphQLError(
      `Coordonnées invalides : ${result.error.issues.map((issue) => issue.message).join(', ')}`,
      { extensions: { code: 'BAD_USER_INPUT' } },
    );
  }
  return result.data;
}

export const resolvers = {
  Query: {
    health: async () => {
      try {
        await db.execute(sql`select 1`);
        return 'ok';
      } catch (error) {
        console.warn('Database health check failed:', error);
        return 'degraded';
      }
    },

    getBase: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.baseRepo.findById(normalizeId(id));
    },
    listBases: async (_: any, __: any, ctx: any) => {
      return ctx.repositories.baseRepo.findAll();
    },

    getAccessPoint: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.accessPointRepo.findById(normalizeId(id));
    },
    listAccessPoints: async (_: any, { baseId }: any, ctx: any) => {
      return ctx.repositories.accessPointRepo.findByBaseId(normalizeId(baseId));
    },

    getNetwork: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.networkRepo.findById(normalizeId(id));
    },
    listNetworks: async (_: any, { accessPointId }: any, ctx: any) => {
      return ctx.repositories.networkRepo.findByAccessPointId(normalizeId(accessPointId));
    },
    networkStats: async (_: any, { networkId }: any, ctx: any) => {
      const stats = await ctx.repositories.ipAddressRepo.getNetworkStats(normalizeId(networkId));
      return {
        networkId,
        totalIps: stats.total,
        freeIps: stats.free,
        occupiedIps: stats.occupied,
        reservedIps: stats.reserved,
        decommissionedIps: stats.decommissioned,
      };
    },

    calculateSubnet: async (_: any, { cidr }: any) => {
      const info = IpCalculatorService.fromCidr(cidr);
      return {
        cidr,
        networkAddress: info.networkAddress,
        broadcastAddress: info.broadcastAddress,
        subnetMask: info.subnetMask,
        wildcardMask: info.wildcardMask,
        usableStart: info.usableStart,
        usableEnd: info.usableEnd,
        totalHosts: info.totalHosts,
        prefix: info.prefix,
        isPrivate: info.isPrivate,
      };
    },

    isIpInNetwork: async (_: any, { ip, networkId }: any, ctx: any) => {
      const network = await ctx.repositories.networkRepo.findById(normalizeId(networkId));
      if (!network) throw new Error(`Network with id ${networkId} not found`);
      return IpCalculatorService.isIpInNetwork(ip, network.cidr);
    },

    suggestNextNetwork: async (_: any, { baseNetworkId, prefix }: any, ctx: any) => {
      const baseNetwork = await ctx.repositories.networkRepo.findById(normalizeId(baseNetworkId));
      if (!baseNetwork) throw new Error(`Network with id ${baseNetworkId} not found`);

      // Get all existing subnets within this network
      const allNetworks: Network[] = await ctx.repositories.networkRepo.findByAccessPointId(
        normalizeId(baseNetwork.accessPointId),
      );
      const existingCidrs = allNetworks
        .filter((network) => IpCalculatorService.isIpInNetwork(network.networkAddress, baseNetwork.cidr))
        .map((network) => network.cidr);

      if (prefix <= baseNetwork.prefix) {
        throw new Error(`New prefix must be larger than base prefix ${baseNetwork.prefix}`);
      }

      // Find next available subnet
      const potentialSubnets = IpCalculatorService.splitSubnet(
        baseNetwork.cidr,
        Math.pow(2, prefix - baseNetwork.prefix),
      );

      for (const subnet of potentialSubnets) {
        if (!existingCidrs.includes(subnet)) {
          return subnet;
        }
      }

      throw new Error('No available subnets in the base network');
    },

    splitNetwork: async (_: any, { networkId, newPrefix }: any, ctx: any) => {
      const network = await ctx.repositories.networkRepo.findById(normalizeId(networkId));
      if (!network) throw new Error(`Network with id ${networkId} not found`);

      const count = Math.pow(2, newPrefix - network.prefix);
      if (count < 2) {
        throw new Error(`New prefix ${newPrefix} must be larger than current prefix ${network.prefix}`);
      }

      const subnets = IpCalculatorService.splitSubnet(network.cidr, count);
      return subnets.map((cidr) => {
        const info = IpCalculatorService.fromCidr(cidr);
        return {
          cidr,
          networkAddress: info.networkAddress,
          broadcastAddress: info.broadcastAddress,
          subnetMask: info.subnetMask,
          wildcardMask: info.wildcardMask,
          usableStart: info.usableStart,
          usableEnd: info.usableEnd,
          totalHosts: info.totalHosts,
          prefix: info.prefix,
          isPrivate: info.isPrivate,
        };
      });
    },

    globalIpStats: async (_: any, __: any, ctx: any) => {
      const allNetworks: Network[] = await ctx.repositories.networkRepo.findAll();

      const ipStatsByNetwork: NetworkIpStats[] = await ctx.repositories.ipAddressRepo.getStatsByNetwork();
      const statsByNetworkId = new Map(ipStatsByNetwork.map((stats) => [stats.networkId, stats]));

      let totalNetworks = 0;
      let totalIps = 0;
      let totalUsedIps = 0;
      let totalFreeIps = 0;
      let totalReservedIps = 0;
      let privateCount = 0;
      let publicCount = 0;

      for (const network of allNetworks) {
        const netInfo = network;
        const ipStats = statsByNetworkId.get(network.id);

        totalNetworks += 1;
        totalIps += netInfo.totalHosts;
        totalUsedIps += ipStats?.occupied ?? 0;
        totalFreeIps += ipStats?.free ?? 0;
        totalReservedIps += ipStats?.reserved ?? 0;

        if (netInfo.isPrivate) privateCount += 1;
        else publicCount += 1;
      }

      const utilization =
        totalIps > 0 ? ((totalUsedIps + totalReservedIps) / totalIps) * 100 : 0;
      const avgSubnetSize = totalNetworks > 0 ? totalIps / totalNetworks : 0;

      return {
        totalNetworks,
        totalIps,
        totalUsedIps,
        totalFreeIps,
        totalReservedIps,
        utilizationPercentage: Math.round(utilization * 100) / 100,
        averageSubnetSize: Math.round(avgSubnetSize),
        privateNetworksCount: privateCount,
        publicNetworksCount: publicCount,
      };
    },

    getClient: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.clientRepo.findById(normalizeId(id));
    },
    listClients: async (_: any, { accessPointId, limit = 50, offset = 0 }: any, ctx: any) => {
      const clients = await ctx.repositories.clientRepo.findByAccessPointId(normalizeId(accessPointId));
      return {
        data: clients.slice(offset, offset + limit),
        total: clients.length,
        limit,
        offset,
      };
    },
    searchClients: async (_: any, { query, limit = 20, offset = 0 }: any, ctx: any) => {
      if (!query || !query.trim()) return [];
      return ctx.repositories.clientRepo.search(query, limit, offset);
    },

    getIpAddress: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.ipAddressRepo.findById(normalizeId(id));
    },
    listAvailableIps: async (_: any, { networkId, limit = 50, offset = 0 }: any, ctx: any) => {
      const nId = normalizeId(networkId);
      const ips = await ctx.repositories.ipAddressRepo.findAvailableByNetwork(nId, limit, offset);
      const total = await ctx.repositories.ipAddressRepo.countAvailableByNetwork(nId);
      return { data: ips, total, limit, offset };
    },
    listIpAddressesByStatus: async (_: any, { status, limit = 50, offset = 0 }: any, ctx: any) => {
      const ips = await ctx.repositories.ipAddressRepo.findByStatus(status, limit, offset);
      const total = await ctx.repositories.ipAddressRepo.countByStatus(status);
      return { data: ips, total, limit, offset };
    },
    listIpAddressesByNetwork: async (_: any, { networkId, limit = 50, offset = 0 }: any, ctx: any) => {
      const nId = normalizeId(networkId);
      const ips = await ctx.repositories.ipAddressRepo.findByNetworkId(nId, limit, offset);
      const total = await ctx.repositories.ipAddressRepo.countByNetworkId(nId);
      return { data: ips, total, limit, offset };
    },

    ipAssignmentHistory: async (_: any, { ipAddressId }: any, ctx: any) => {
      return ctx.repositories.assignmentRepo.listHistoryByIp(ipAddressId);
    },

    getFieldReport: async (_: any, { cpeId }: any, ctx: any) => {
      return ctx.signalMonitoring.getFieldReport.execute(cpeId);
    },
    listCpesNeedingRealignment: async (_: any, { accessPointId }: any, ctx: any) => {
      return ctx.signalMonitoring.listCpesNeedingRealignment.execute(accessPointId);
    },
    getSignalHistory: async (_: any, { cpeId, limit = 20 }: any, ctx: any) => {
      return ctx.signalMonitoring.getSignalHistory.execute(cpeId, limit);
    },
    getCurrentSignal: async (_: any, { cpeId }: any, ctx: any) => {
      return ctx.signalMonitoring.getCurrentSignal.execute(cpeId);
    },

    findClientsNearAccessPoint: async (_: any, { accessPointId, maxDistance = 100 }: any, ctx: any) => {
      return ctx.geolocation.findClientsNearAccessPoint.execute(accessPointId, maxDistance);
    },
    findNearestAccessPoint: async (_: any, { clientId }: any, ctx: any) => {
      try {
        return await ctx.geolocation.findNearestAccessPoint.execute(clientId);
      } catch (error) {
        console.warn('Nearest AP lookup by client failed:', error);
        return null;
      }
    },
    findNearestAccessPointAtPosition: async (_: any, { coordinates }: any, ctx: any) => {
      try {
        const position = validateCoordinates(coordinates);
        return await ctx.geolocation.findNearestAccessPoint.executeAtPosition(position);
      } catch (error) {
        console.warn('Nearest AP lookup by position failed:', error);
        return null;
      }
    },
    listMapLocations: async (_: any, __: any, ctx: any) => {
      try {
        return await ctx.geolocation.listMapLocations.execute();
      } catch (error) {
        console.warn('Map location list failed:', error);
        return [];
      }
    },
    listClientsNeedingGeolocation: async (_: any, __: any, ctx: any) => {
      return ctx.geolocation.listClientsNeedingGeolocation.execute();
    },
  },
  Mutation: {
    createBase: async (_: any, { input }: any, ctx: any) => {
      // Validate required fields
      if (!input || !input.name || !input.name.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'name'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!input.location || !input.location.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'location'", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      // Prevent duplicate by name+location (idempotent create)
      const existing = await ctx.repositories.baseRepo.findByNameAndLocation(input.name, input.location);
      if (existing) {
        throw new GraphQLError("Une base avec ce nom et cette localisation existe déjà", {
          extensions: { code: 'BAD_USER_INPUT', existingId: `bas${existing.id}` },
        });
      }

      const base = new Base({
        id: uuidv4(),
        name: input.name,
        location: input.location,
        status: input.status,
        ...(input.coordinates
          ? validateCoordinates(input.coordinates)
          : {}),
      });
      await ctx.repositories.baseRepo.save(base);
      return base;
    },
    updateBase: async (_: any, { id, input }: any, ctx: any) => {
      const base = await ctx.repositories.baseRepo.findById(normalizeId(id));
      if (!base) throw new Error(`Base with id ${id} not found`);

      if (input.name) base.name = input.name;
      if (input.location) base.location = input.location;
      if (input.status) {
        if (input.status === 'active') base.activate();
        else if (input.status === 'inactive') base.deactivate();
        else if (input.status === 'maintenance') base.setMaintenance();
      }
      if (input.coordinates) {
        const coordinates = validateCoordinates(input.coordinates);
        base.latitude = coordinates.latitude;
        base.longitude = coordinates.longitude;
        base.altitude = coordinates.altitude;
      }

      await ctx.repositories.baseRepo.save(base);
      return base;
    },
    deleteBase: async (_: any, { id }: any, ctx: any) => {
      if (!id || !id.toString().trim()) {
        throw new GraphQLError("Veuillez fournir 'id'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      const deletedBase = await ctx.repositories.baseRepo.delete(normalizeId(id));
      if (!deletedBase) throw new Error(`Base with id ${id} not found`);
      return deletedBase;
    },

    createAccessPoint: async (_: any, { input }: any, ctx: any) => {
      // Validate required fields
      if (!input || !input.name || !input.name.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'name'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!input.managementIpId || !input.managementIpId.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'managementIpId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!input.baseId || !input.baseId.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'baseId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!input.sector || !input.sector.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'sector'", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      // Check for existing AP by management IP
      const allAps = await ctx.repositories.accessPointRepo.findAll();
      const foundAp = allAps.find((ap: any) => (ap.managementIpId || '').toString().trim() === input.managementIpId.toString().trim());
      if (foundAp) {
        throw new GraphQLError("Un point d'accès avec cette IP de management existe déjà", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const accessPoint = new AccessPoint({
        id: uuidv4(),
        name: input.name,
        managementIpId: input.managementIpId,
        baseId: input.baseId,
        sector: input.sector,
        status: input.status,
        ...(input.coordinates
          ? validateCoordinates(input.coordinates)
          : {}),
        azimuth: input.azimuth,
        tilt: input.tilt,
        beamwidth: input.beamwidth,
      });
      await ctx.repositories.accessPointRepo.save(accessPoint);
      return accessPoint;
    },
    updateAccessPoint: async (_: any, { id, input }: any, ctx: any) => {
      const accessPoint = await ctx.repositories.accessPointRepo.findById(id);
      if (!accessPoint) throw new Error(`AccessPoint with id ${id} not found`);

      if (input.name) accessPoint.name = input.name;
      if (input.sector) accessPoint.sector = input.sector;
      if (input.status) {
        if (input.status === 'online') accessPoint.goOnline();
        else if (input.status === 'offline') accessPoint.goOffline();
        else if (input.status === 'maintenance') accessPoint.setMaintenance();
      }
      if (input.coordinates) {
        const coordinates = validateCoordinates(input.coordinates);
        accessPoint.latitude = coordinates.latitude;
        accessPoint.longitude = coordinates.longitude;
        accessPoint.altitude = coordinates.altitude;
      }
      if (input.azimuth !== undefined) accessPoint.azimuth = input.azimuth;
      if (input.tilt !== undefined) accessPoint.tilt = input.tilt;
      if (input.beamwidth !== undefined) accessPoint.beamwidth = input.beamwidth;

      await ctx.repositories.accessPointRepo.save(accessPoint);
      return accessPoint;
    },
    updateAccessPointStatus: async (_: any, { id, status }: any, ctx: any) => {
      const accessPoint = await ctx.repositories.accessPointRepo.findById(id);
      if (!accessPoint) throw new Error(`AccessPoint with id ${id} not found`);

      if (status === 'online') accessPoint.goOnline();
      else if (status === 'offline') accessPoint.goOffline();
      else if (status === 'maintenance') accessPoint.setMaintenance();
      await ctx.repositories.accessPointRepo.save(accessPoint);
      return accessPoint;
    },

    createNetwork: async (_: any, { input }: any, ctx: any) => {
      if (!input || !input.cidr || !input.cidr.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'cidr'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!input.gateway || !input.gateway.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'gateway'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (input.vlan === undefined || input.vlan === null) {
        throw new GraphQLError("Veuillez remplir le champ 'vlan'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!input.accessPointId || !input.accessPointId.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'accessPointId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const allNets = await ctx.repositories.networkRepo.findAll();
      const foundNet = allNets.find((n: any) => (n.cidr || '').toString().trim().toLowerCase() === input.cidr.toString().trim().toLowerCase());
      if (foundNet) {
        throw new GraphQLError("Un réseau avec ce CIDR existe déjà", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const network = new Network({
        id: uuidv4(),
        cidr: input.cidr,
        gateway: input.gateway,
        vlan: input.vlan,
        accessPointId: input.accessPointId,
      });
      await ctx.repositories.networkRepo.save(network);
      return network;
    },
    updateNetwork: async (_: any, { id, input }: any, ctx: any) => {
      const network = await ctx.repositories.networkRepo.findById(id);
      if (!network) throw new Error(`Network with id ${id} not found`);

      if (input.cidr) network.cidr = input.cidr;
      if (input.gateway) network.gateway = input.gateway;
      if (input.vlan !== undefined) network.vlan = input.vlan;

      await ctx.repositories.networkRepo.save(network);
      return network;
    },
    deleteNetwork: async (_: any, { id }: any, ctx: any) => {
      if (!id || !id.toString().trim()) {
        throw new GraphQLError("Veuillez fournir 'id'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      const deletedNetwork = await ctx.repositories.networkRepo.delete(normalizeId(id));
      if (!deletedNetwork) throw new Error(`Network with id ${id} not found`);
      return deletedNetwork;
    },

    createClient: async (_: any, { input }: any, ctx: any) => {
      if (!input || !input.fullName || !input.fullName.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'fullName'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!input.phoneNumber || !input.phoneNumber.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'phoneNumber'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!input.clientType) {
        throw new GraphQLError("Veuillez remplir le champ 'clientType'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!input.accessPointId || !input.accessPointId.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'accessPointId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const allClients = await ctx.repositories.clientRepo.findByAccessPointId(input.accessPointId);
      const foundClient = (allClients || []).find((c: any) => (c.phoneNumber || '').toString().trim() === input.phoneNumber.toString().trim());
      if (foundClient) {
        throw new GraphQLError("Un client avec ce numéro de téléphone existe déjà", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const client = new Client({
        id: uuidv4(),
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        clientType: input.clientType,
        accessPointId: input.accessPointId,
        ipAddressId: input.ipAddressId,
        coordinates: input.coordinates
          ? validateCoordinates(input.coordinates)
          : undefined,
      });
      await ctx.repositories.clientRepo.save(client);
      return client;
    },
    updateClient: async (_: any, { id, input }: any, ctx: any) => {
      const client = await ctx.repositories.clientRepo.findById(id);
      if (!client) throw new Error(`Client with id ${id} not found`);

      if (input.fullName) client.fullName = input.fullName;
      if (input.phoneNumber) client.phoneNumber = input.phoneNumber;
      if (input.clientType) client.clientType = input.clientType;
      if (input.coordinates) {
        client.coordinates = validateCoordinates(input.coordinates);
      }

      await ctx.repositories.clientRepo.save(client);
      return client;
    },
    deleteClient: async (_: any, { id }: any, ctx: any) => {
      if (!id || !id.toString().trim()) {
        throw new GraphQLError("Veuillez fournir 'id'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      const deletedClient = await ctx.repositories.clientRepo.delete(normalizeId(id));
      if (!deletedClient) throw new Error(`Client with id ${id} not found`);
      return deletedClient;
    },
    changeClientAccessPoint: async (_: any, { input }: any, ctx: any) => {
      if (!input || !input.clientId || !input.clientId.toString().trim()) {
        throw new GraphQLError("Veuillez fournir 'clientId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!input.newAccessPointId || !input.newAccessPointId.toString().trim()) {
        throw new GraphQLError("Veuillez fournir 'newAccessPointId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const client = await ctx.repositories.clientRepo.findById(input.clientId);
      if (!client) throw new Error(`Client with id ${input.clientId} not found`);

      client.accessPointId = input.newAccessPointId;
      await ctx.repositories.clientRepo.save(client);
      return client;
    },
    updateClientLocation: async (_: any, { clientId, coordinates }: any, ctx: any) => {
      if (!clientId || !clientId.toString().trim()) {
        throw new GraphQLError("Veuillez fournir 'clientId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      const validCoordinates = validateCoordinates(coordinates);

      const client = await ctx.repositories.clientRepo.findById(clientId);
      if (!client) throw new Error(`Client with id ${clientId} not found`);

      client.coordinates = {
        ...validCoordinates,
      };
      await ctx.repositories.clientRepo.save(client);
      return client;
    },

    createIpAddress: async (_: any, { input }: any, ctx: any) => {
      if (!input || !input.address || !input.address.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'address'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!input.networkId || !input.networkId.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'networkId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const existing = await ctx.repositories.ipAddressRepo.findByAddress(input.address.toString());
      if (existing) {
        throw new GraphQLError("Une adresse IP identique existe déjà", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const ipAddress = new IpAddress({
        id: uuidv4(),
        address: input.address,
        usageType: input.usageType,
        reserved: input.reserved,
        active: input.active,
        networkId: input.networkId,
      });
      await ctx.repositories.ipAddressRepo.save(ipAddress);
      return ipAddress;
    },
    assignIp: async (_: any, { input }: any, ctx: any) => {
      if (!input) throw new GraphQLError("Veuillez fournir les informations d'assignation", { extensions: { code: 'BAD_USER_INPUT' } });
      const clientId = normalizeId(input.clientId);
      const accessPointId = normalizeId(input.accessPointId);
      const networkId = normalizeId(input.networkId);
      const ipAddressId = input.ipAddressId
        ? normalizeId(input.ipAddressId)
        : undefined;
      if (!clientId || !accessPointId) {
        throw new GraphQLError("Veuillez fournir 'clientId' et 'accessPointId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!networkId) {
        throw new GraphQLError("Veuillez remplir le champ 'networkId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const dto = {
        clientId,
        accessPointId,
        networkId,
        ipAddressId,
      };
      return ctx.ipAllocation.assignIp.execute(dto);
    },
    releaseIp: async (_: any, { ipAddressId }: any, ctx: any) => {
      if (!ipAddressId || !ipAddressId.toString().trim()) {
        throw new GraphQLError("Veuillez fournir 'ipAddressId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      await ctx.ipAllocation.releaseIp.execute(ipAddressId);
      return true;
    },
    reserveIp: async (_: any, { input }: any, ctx: any) => {
      if (!input || !input.ipAddressId || !input.ipAddressId.toString().trim()) {
        throw new GraphQLError("Veuillez fournir 'ipAddressId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      const ipAddress = await ctx.repositories.ipAddressRepo.findById(input.ipAddressId);
      if (!ipAddress) throw new Error(`IpAddress with id ${input.ipAddressId} not found`);

      ipAddress.reserve(input.usageType);

      await ctx.repositories.ipAddressRepo.save(ipAddress);
      return ipAddress;
    },
    decommissionIp: async (_: any, { input }: any, ctx: any) => {
      if (!input || !input.ipAddressId || !input.ipAddressId.toString().trim()) {
        throw new GraphQLError("Veuillez fournir 'ipAddressId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      const ipAddress = await ctx.repositories.ipAddressRepo.findById(input.ipAddressId);
      if (!ipAddress) throw new Error(`IpAddress with id ${input.ipAddressId} not found`);

      ipAddress.decommission();

      await ctx.repositories.ipAddressRepo.save(ipAddress);
      return ipAddress;
    },
    bulkAssignIp: async (_: any, { input }: any, ctx: any) => {
      if (!input || !Array.isArray(input.clientIds) || input.clientIds.length === 0) {
        throw new GraphQLError("Veuillez fournir une liste 'clientIds' non vide", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!input.networkId || !input.networkId.toString().trim()) {
        throw new GraphQLError("Veuillez remplir le champ 'networkId'", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const assignments = [];
      for (const clientId of input.clientIds) {
        const dto = {
          clientId,
          accessPointId: input.accessPointId,
          networkId: input.networkId,
        };
        const assignment = await ctx.ipAllocation.assignIp.execute(dto);
        assignments.push(assignment);
      }
      return assignments;
    },
    createCpeDevice: async (_: any, { input }: any, ctx: any) => {
      if (!input) throw new GraphQLError("Veuillez fournir les informations du CPE", { extensions: { code: 'BAD_USER_INPUT' } });
      return ctx.signalMonitoring.createCpeDevice.execute({
        ...input,
        coordinates: input.coordinates
          ? validateCoordinates(input.coordinates)
          : undefined,
      });
    },
    updateCpeLocation: async (_: any, { id, coordinates, azimuth }: any, ctx: any) => {
      if (!id || !id.toString().trim()) {
        throw new GraphQLError("Veuillez fournir 'id'", { extensions: { code: 'BAD_USER_INPUT' } });
      }
      return ctx.signalMonitoring.updateCpeLocation.execute({
        id: normalizeId(id),
        coordinates: validateCoordinates(coordinates),
        azimuth,
      });
    },
    recordSignalMetric: async (_: any, { input }: any, ctx: any) => {
      if (!input) throw new GraphQLError("Veuillez fournir les métriques du signal", { extensions: { code: 'BAD_USER_INPUT' } });
      return ctx.signalMonitoring.recordSignalMetric.execute(input);
    },
  },
  Base: {
    id: (base: any) => `bas${base.id}`,
    coordinates: (base: any) => {
      return base.latitude !== undefined || base.longitude !== undefined
        ? { latitude: base.latitude, longitude: base.longitude, altitude: base.altitude }
        : null;
    },
  },
  AccessPoint: {
    id: (ap: any) => `ap${ap.id}`,
    coordinates: (ap: any) => {
      return ap.latitude !== undefined || ap.longitude !== undefined
        ? { latitude: ap.latitude, longitude: ap.longitude, altitude: ap.altitude }
        : null;
    },
  },
  Client: {
    id: (client: any) => `cli${client.id}`,
    coordinates: (client: any) => client.coordinates ?? null,
  },
  Network: {
    id: (net: any) => `net${net.id}`,
  },
  CpeDevice: {
    id: (cpe: any) => `cpe${cpe.id}`,
    coordinates: (cpe: any) => cpe.coordinates ?? null,
  },
  SignalMetric: {
    id: (metric: any) => `sm${metric.id}`,
    evaluation: (metric: any) => metric.evaluation,
  },
  IpAddress: {
    id: (ip: any) => `ip${ip.id}`,
  },
  IpAssignment: {
    id: (a: any) => `ia${a.id}`,
  },
  MapLocation: {
    id: (location: any) => {
      const prefixes: Record<string, string> = {
        base: 'bas',
        accessPoint: 'ap',
        client: 'cli',
        cpe: 'cpe',
      };
      return `${prefixes[location.kind]}${location.id}`;
    },
  },
  NearestAccessPointAtPosition: {
    accessPointId: (result: any) => `ap${result.accessPointId}`,
  },
  FieldReport: {
    distanceMeters: (report: any) => report.distanceMeters ?? report.latestSignal?.distance ?? null,
  },
};