import { v4 as uuidv4 } from 'uuid';
import { Base } from '@/domain/base/Base';
import { AccessPoint } from '@/domain/accessPoint/AccessPoint';
import { Network } from '@/domain/network/Network';
import { Client } from '@/domain/client/Client';
import { IpAddress } from '@/domain/ipAddress/IpAddress';

export const resolvers = {
  Query: {
    health: () => 'ok',
    
    // Base Queries
    getBase: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.baseRepo.findById(id);
    },
    listBases: async (_: any, __: any, ctx: any) => {
      return ctx.repositories.baseRepo.findAll();
    },
    
    // AccessPoint Queries
    getAccessPoint: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.accessPointRepo.findById(id);
    },
    listAccessPoints: async (_: any, { baseId }: any, ctx: any) => {
      return ctx.repositories.accessPointRepo.findByBaseId(baseId);
    },
    
    // Network Queries
    getNetwork: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.networkRepo.findById(id);
    },
    listNetworks: async (_: any, { accessPointId }: any, ctx: any) => {
      return ctx.repositories.networkRepo.findByAccessPointId(accessPointId);
    },
    networkStats: async (_: any, { networkId }: any, ctx: any) => {
      const stats = await ctx.repositories.ipAddressRepo.getNetworkStats(networkId);
      return {
        networkId,
        totalIps: stats.total,
        freeIps: stats.free,
        occupiedIps: stats.occupied,
        reservedIps: stats.reserved,
        decommissionedIps: stats.decommissioned,
      };
    },
    
    // Client Queries
    getClient: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.clientRepo.findById(id);
    },
    listClients: async (_: any, { accessPointId, limit = 50, offset = 0 }: any, ctx: any) => {
      const clients = await ctx.repositories.clientRepo.findByAccessPointId(accessPointId, limit, offset);
      const total = await ctx.repositories.clientRepo.countByAccessPointId(accessPointId);
      return { data: clients, total, limit, offset };
    },
    searchClients: async (_: any, { query, limit = 20, offset = 0 }: any, ctx: any) => {
      if (!query || !query.trim()) return [];
      return ctx.repositories.clientRepo.search(query, limit, offset);
    },
    
    // IpAddress Queries
    getIpAddress: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.ipAddressRepo.findById(id);
    },
    listAvailableIps: async (_: any, { networkId, limit = 50, offset = 0 }: any, ctx: any) => {
      const ips = await ctx.repositories.ipAddressRepo.findAvailableByNetwork(networkId, limit, offset);
      const total = await ctx.repositories.ipAddressRepo.countAvailableByNetwork(networkId);
      return { data: ips, total, limit, offset };
    },
    listIpAddressesByStatus: async (_: any, { status, limit = 50, offset = 0 }: any, ctx: any) => {
      const ips = await ctx.repositories.ipAddressRepo.findByStatus(status, limit, offset);
      const total = await ctx.repositories.ipAddressRepo.countByStatus(status);
      return { data: ips, total, limit, offset };
    },
    listIpAddressesByNetwork: async (_: any, { networkId, limit = 50, offset = 0 }: any, ctx: any) => {
      const ips = await ctx.repositories.ipAddressRepo.findByNetworkId(networkId, limit, offset);
      const total = await ctx.repositories.ipAddressRepo.countByNetworkId(networkId);
      return { data: ips, total, limit, offset };
    },
    
    // Assignment History
    ipAssignmentHistory: async (_: any, { ipAddressId }: any, ctx: any) => {
      return ctx.repositories.assignmentRepo.listHistoryByIp(ipAddressId);
    },
  },
  Mutation: {
    // Base Mutations
    createBase: async (_: any, { input }: any, ctx: any) => {
      const base = new Base({ id: uuidv4(), name: input.name, location: input.location, status: input.status });
      await ctx.repositories.baseRepo.save(base);
      return base;
    },
    updateBase: async (_: any, { id, input }: any, ctx: any) => {
      const base = await ctx.repositories.baseRepo.findById(id);
      if (!base) throw new Error(`Base with id ${id} not found`);
      
      if (input.name) base.name = input.name;
      if (input.location) base.location = input.location;
      if (input.status) base.status = input.status;
      
      await ctx.repositories.baseRepo.save(base);
      return base;
    },
    deleteBase: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.baseRepo.delete(id);
    },
    
    // AccessPoint Mutations
    createAccessPoint: async (_: any, { input }: any, ctx: any) => {
      const accessPoint = new AccessPoint({
        id: uuidv4(),
        name: input.name,
        managementIpId: input.managementIpId,
        baseId: input.baseId,
        sector: input.sector,
        status: input.status,
      });
      await ctx.repositories.accessPointRepo.save(accessPoint);
      return accessPoint;
    },
    updateAccessPoint: async (_: any, { id, input }: any, ctx: any) => {
      const accessPoint = await ctx.repositories.accessPointRepo.findById(id);
      if (!accessPoint) throw new Error(`AccessPoint with id ${id} not found`);
      
      if (input.name) accessPoint.name = input.name;
      if (input.sector) accessPoint.sector = input.sector;
      if (input.status) accessPoint.status = input.status;
      
      await ctx.repositories.accessPointRepo.save(accessPoint);
      return accessPoint;
    },
    updateAccessPointStatus: async (_: any, { id, status }: any, ctx: any) => {
      const accessPoint = await ctx.repositories.accessPointRepo.findById(id);
      if (!accessPoint) throw new Error(`AccessPoint with id ${id} not found`);
      
      accessPoint.status = status;
      await ctx.repositories.accessPointRepo.save(accessPoint);
      return accessPoint;
    },
    
    // Network Mutations
    createNetwork: async (_: any, { input }: any, ctx: any) => {
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
      if (input.vlan) network.vlan = input.vlan;
      
      await ctx.repositories.networkRepo.save(network);
      return network;
    },
    deleteNetwork: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.networkRepo.delete(id);
    },
    
    // Client Mutations
    createClient: async (_: any, { input }: any, ctx: any) => {
      const client = new Client({
        id: uuidv4(),
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        clientType: input.clientType,
        accessPointId: input.accessPointId,
        ipAddressId: input.ipAddressId,
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
      
      await ctx.repositories.clientRepo.save(client);
      return client;
    },
    deleteClient: async (_: any, { id }: any, ctx: any) => {
      return ctx.repositories.clientRepo.delete(id);
    },
    changeClientAccessPoint: async (_: any, { input }: any, ctx: any) => {
      const client = await ctx.repositories.clientRepo.findById(input.clientId);
      if (!client) throw new Error(`Client with id ${input.clientId} not found`);
      
      client.accessPointId = input.newAccessPointId;
      await ctx.repositories.clientRepo.save(client);
      return client;
    },
    
    // IpAddress Mutations
    createIpAddress: async (_: any, { input }: any, ctx: any) => {
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
      const dto = {
        clientId: input.clientId,
        accessPointId: input.accessPointId,
        networkId: input.networkId,
      };
      return ctx.ipAllocation.assignIp.execute(dto);
    },
    releaseIp: async (_: any, { ipAddressId }: any, ctx: any) => {
      await ctx.ipAllocation.releaseIp.execute(ipAddressId);
      return true;
    },
    reserveIp: async (_: any, { input }: any, ctx: any) => {
      const ipAddress = await ctx.repositories.ipAddressRepo.findById(input.ipAddressId);
      if (!ipAddress) throw new Error(`IpAddress with id ${input.ipAddressId} not found`);
      
      ipAddress.reserved = true;
      ipAddress.usageType = input.usageType;
      ipAddress.status = 'reserved';
      
      await ctx.repositories.ipAddressRepo.save(ipAddress);
      return ipAddress;
    },
    decommissionIp: async (_: any, { input }: any, ctx: any) => {
      const ipAddress = await ctx.repositories.ipAddressRepo.findById(input.ipAddressId);
      if (!ipAddress) throw new Error(`IpAddress with id ${input.ipAddressId} not found`);
      
      ipAddress.status = 'decommissioned';
      ipAddress.active = false;
      
      await ctx.repositories.ipAddressRepo.save(ipAddress);
      return ipAddress;
    },
    bulkAssignIp: async (_: any, { input }: any, ctx: any) => {
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
  },
};