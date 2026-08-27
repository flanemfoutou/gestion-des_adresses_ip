import { v4 as uuidv4 } from 'uuid';
import { Base } from '@/domain/base/Base';
import { AccessPoint } from '@/domain/accessPoint/AccessPoint';
import { Network } from '@/domain/network/Network';
import { Client } from '@/domain/client/Client';
import { IpAddress } from '@/domain/ipAddress/IpAddress';
import { IpCalculatorService } from '@/domain/network/IpCalculatorService';
import { eq } from 'drizzle-orm';
import { db } from '@/infrastructure/db/neon';
import { networks as networkTable, ipAddresses } from '@/infrastructure/db/schema';
function normalizeId(id) {
    if (!id)
        return id;
    const s = id.toString();
    if (s.length === 36)
        return s;
    if (s.length > 36)
        return s.slice(-36);
    return s;
}
export const resolvers = {
    Query: {
        health: () => 'ok',
        getBase: async (_, { id }, ctx) => {
            return ctx.repositories.baseRepo.findById(id);
        },
        listBases: async (_, __, ctx) => {
            return ctx.repositories.baseRepo.findAll();
        },
        getAccessPoint: async (_, { id }, ctx) => {
            return ctx.repositories.accessPointRepo.findById(id);
        },
        listAccessPoints: async (_, { baseId }, ctx) => {
            return ctx.repositories.accessPointRepo.findByBaseId(baseId);
        },
        getNetwork: async (_, { id }, ctx) => {
            return ctx.repositories.networkRepo.findById(id);
        },
        listNetworks: async (_, { accessPointId }, ctx) => {
            return ctx.repositories.networkRepo.findByAccessPointId(accessPointId);
        },
        networkStats: async (_, { networkId }, ctx) => {
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
        calculateSubnet: async (_, { cidr }) => {
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
        isIpInNetwork: async (_, { ip, networkId }, ctx) => {
            const network = await ctx.repositories.networkRepo.findById(networkId);
            if (!network)
                throw new Error(`Network with id ${networkId} not found`);
            return IpCalculatorService.isIpInNetwork(ip, network.cidr);
        },
        suggestNextNetwork: async (_, { baseNetworkId, prefix }, ctx) => {
            const baseNetwork = await ctx.repositories.networkRepo.findById(baseNetworkId);
            if (!baseNetwork)
                throw new Error(`Network with id ${baseNetworkId} not found`);
            // Get all existing subnets within this network
            const allNetworks = await ctx.repositories.networkRepo.findByAccessPointId(baseNetwork.accessPointId);
            const existingCidrs = allNetworks
                .filter((n) => IpCalculatorService.isIpInNetwork(n.networkAddress, baseNetwork.cidr))
                .map((n) => n.cidr);
            if (prefix <= baseNetwork.prefix) {
                throw new Error(`New prefix must be larger than base prefix ${baseNetwork.prefix}`);
            }
            // Find next available subnet
            const potentialSubnets = IpCalculatorService.splitSubnet(baseNetwork.cidr, Math.pow(2, prefix - baseNetwork.prefix));
            for (const subnet of potentialSubnets) {
                if (!existingCidrs.includes(subnet)) {
                    return subnet;
                }
            }
            throw new Error('No available subnets in the base network');
        },
        splitNetwork: async (_, { networkId, newPrefix }, ctx) => {
            const network = await ctx.repositories.networkRepo.findById(networkId);
            if (!network)
                throw new Error(`Network with id ${networkId} not found`);
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
        globalIpStats: async (_, __, ctx) => {
            const allNetworks = await ctx.repositories.networkRepo.findAll?.() ||
                (await db.select().from(networkTable));
            let totalNetworks = allNetworks.length;
            let totalIps = 0;
            let totalUsedIps = 0;
            let totalFreeIps = 0;
            let totalReservedIps = 0;
            let privateCount = 0;
            let publicCount = 0;
            for (const network of allNetworks) {
                const netInfo = network instanceof Network ? network : IpCalculatorService.fromCidr(network.cidr);
                const usedIpRecords = await db
                    .select()
                    .from(ipAddresses)
                    .where(eq(ipAddresses.networkId, network.id));
                const used = usedIpRecords.filter((ip) => ip.status === 'occupied').length;
                const reserved = usedIpRecords.filter((ip) => ip.status === 'reserved').length;
                const free = usedIpRecords.filter((ip) => ip.status === 'free').length;
                totalNetworks += 1;
                totalIps += netInfo.totalHosts;
                totalUsedIps += used;
                totalFreeIps += free;
                totalReservedIps += reserved;
                if (netInfo.isPrivate)
                    privateCount += 1;
                else
                    publicCount += 1;
            }
            const utilization = totalIps > 0 ? ((totalUsedIps + totalReservedIps) / totalIps) * 100 : 0;
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
        getClient: async (_, { id }, ctx) => {
            return ctx.repositories.clientRepo.findById(id);
        },
        listClients: async (_, { accessPointId, limit = 50, offset = 0 }, ctx) => {
            const clients = await ctx.repositories.clientRepo.findByAccessPointId(accessPointId);
            return {
                data: clients.slice(offset, offset + limit),
                total: clients.length,
                limit,
                offset,
            };
        },
        searchClients: async (_, { query, limit = 20, offset = 0 }, ctx) => {
            if (!query || !query.trim())
                return [];
            return ctx.repositories.clientRepo.search(query, limit, offset);
        },
        getIpAddress: async (_, { id }, ctx) => {
            return ctx.repositories.ipAddressRepo.findById(id);
        },
        listAvailableIps: async (_, { networkId, limit = 50, offset = 0 }, ctx) => {
            const ips = await ctx.repositories.ipAddressRepo.findAvailableByNetwork(networkId, limit, offset);
            const total = await ctx.repositories.ipAddressRepo.countAvailableByNetwork(networkId);
            return { data: ips, total, limit, offset };
        },
        listIpAddressesByStatus: async (_, { status, limit = 50, offset = 0 }, ctx) => {
            const ips = await ctx.repositories.ipAddressRepo.findByStatus(status, limit, offset);
            const total = await ctx.repositories.ipAddressRepo.countByStatus(status);
            return { data: ips, total, limit, offset };
        },
        listIpAddressesByNetwork: async (_, { networkId, limit = 50, offset = 0 }, ctx) => {
            const ips = await ctx.repositories.ipAddressRepo.findByNetworkId(networkId, limit, offset);
            const total = await ctx.repositories.ipAddressRepo.countByNetworkId(networkId);
            return { data: ips, total, limit, offset };
        },
        ipAssignmentHistory: async (_, { ipAddressId }, ctx) => {
            return ctx.repositories.assignmentRepo.listHistoryByIp(ipAddressId);
        },
        getFieldReport: async (_, { cpeId }, ctx) => {
            return ctx.signalMonitoring.getFieldReport.execute(cpeId);
        },
        listCpesNeedingRealignment: async (_, { accessPointId }, ctx) => {
            return ctx.signalMonitoring.listCpesNeedingRealignment.execute(accessPointId);
        },
        getSignalHistory: async (_, { cpeId, limit = 20 }, ctx) => {
            return ctx.signalMonitoring.getSignalHistory.execute(cpeId, limit);
        },
        getCurrentSignal: async (_, { cpeId }, ctx) => {
            return ctx.signalMonitoring.getCurrentSignal.execute(cpeId);
        },
    },
    Mutation: {
        createBase: async (_, { input }, ctx) => {
            const base = new Base({
                id: uuidv4(),
                name: input.name,
                location: input.location,
                status: input.status,
                latitude: input.coordinates?.latitude,
                longitude: input.coordinates?.longitude,
                altitude: input.coordinates?.altitude,
            });
            await ctx.repositories.baseRepo.save(base);
            return base;
        },
        updateBase: async (_, { id, input }, ctx) => {
            const base = await ctx.repositories.baseRepo.findById(normalizeId(id));
            if (!base)
                throw new Error(`Base with id ${id} not found`);
            if (input.name)
                base.name = input.name;
            if (input.location)
                base.location = input.location;
            if (input.status) {
                if (input.status === 'active')
                    base.activate();
                else if (input.status === 'inactive')
                    base.deactivate();
                else if (input.status === 'maintenance')
                    base.setMaintenance();
            }
            if (input.coordinates) {
                base.latitude = input.coordinates.latitude;
                base.longitude = input.coordinates.longitude;
                base.altitude = input.coordinates.altitude;
            }
            await ctx.repositories.baseRepo.save(base);
            return base;
        },
        deleteBase: async (_, { id }, ctx) => {
            const deletedBase = await ctx.repositories.baseRepo.delete(normalizeId(id));
            if (!deletedBase)
                throw new Error(`Base with id ${id} not found`);
            return deletedBase;
        },
        createAccessPoint: async (_, { input }, ctx) => {
            const accessPoint = new AccessPoint({
                id: uuidv4(),
                name: input.name,
                managementIpId: input.managementIpId,
                baseId: input.baseId,
                sector: input.sector,
                status: input.status,
                latitude: input.coordinates?.latitude,
                longitude: input.coordinates?.longitude,
                altitude: input.coordinates?.altitude,
                azimuth: input.azimuth,
                tilt: input.tilt,
                beamwidth: input.beamwidth,
            });
            await ctx.repositories.accessPointRepo.save(accessPoint);
            return accessPoint;
        },
        updateAccessPoint: async (_, { id, input }, ctx) => {
            const accessPoint = await ctx.repositories.accessPointRepo.findById(id);
            if (!accessPoint)
                throw new Error(`AccessPoint with id ${id} not found`);
            if (input.name)
                accessPoint.name = input.name;
            if (input.sector)
                accessPoint.sector = input.sector;
            if (input.status) {
                if (input.status === 'online')
                    accessPoint.goOnline();
                else if (input.status === 'offline')
                    accessPoint.goOffline();
                else if (input.status === 'maintenance')
                    accessPoint.setMaintenance();
            }
            if (input.coordinates) {
                id: (base) => `bas${base.id}`,
                accessPoint.longitude = input.coordinates.longitude;
                accessPoint.altitude = input.coordinates.altitude;
            }
            if (input.azimuth !== undefined)
                accessPoint.azimuth = input.azimuth;
            if (input.tilt !== undefined)
                accessPoint.tilt = input.tilt;
            if (input.beamwidth !== undefined)
                accessPoint.beamwidth = input.beamwidth;
            await ctx.repositories.accessPointRepo.save(accessPoint);
            return accessPoint;
        },
        updateAccessPointStatus: async (_, { id, status }, ctx) => {
            const accessPoint = await ctx.repositories.accessPointRepo.findById(id);
            if (!accessPoint)
                throw new Error(`AccessPoint with id ${id} not found`);
            if (status === 'online')
                accessPoint.goOnline();
            else if (status === 'offline')
                accessPoint.goOffline();
            else if (status === 'maintenance')
                accessPoint.setMaintenance();
            await ctx.repositories.accessPointRepo.save(accessPoint);
            return accessPoint;
        },
        createNetwork: async (_, { input }, ctx) => {
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
        updateNetwork: async (_, { id, input }, ctx) => {
            const network = await ctx.repositories.networkRepo.findById(id);
            if (!network)
                throw new Error(`Network with id ${id} not found`);
            if (input.cidr)
                network.cidr = input.cidr;
            if (input.gateway)
                network.gateway = input.gateway;
            if (input.vlan !== undefined)
                network.vlan = input.vlan;
            await ctx.repositories.networkRepo.save(network);
            return network;
        },
        deleteNetwork: async (_, { id }, ctx) => {
            const deletedNetwork = await ctx.repositories.networkRepo.delete(normalizeId(id));
            if (!deletedNetwork)
                throw new Error(`Network with id ${id} not found`);
            return deletedNetwork;
        },
        createClient: async (_, { input }, ctx) => {
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
        updateClient: async (_, { id, input }, ctx) => {
            const client = await ctx.repositories.clientRepo.findById(id);
            if (!client)
                throw new Error(`Client with id ${id} not found`);
            if (input.fullName)
                client.fullName = input.fullName;
            if (input.phoneNumber)
                client.phoneNumber = input.phoneNumber;
            if (input.clientType)
                client.clientType = input.clientType;
            await ctx.repositories.clientRepo.save(client);
            return client;
        },
        deleteClient: async (_, { id }, ctx) => {
            const deletedClient = await ctx.repositories.clientRepo.delete(normalizeId(id));
            if (!deletedClient)
                throw new Error(`Client with id ${id} not found`);
            return deletedClient;
        },
        changeClientAccessPoint: async (_, { input }, ctx) => {
            const client = await ctx.repositories.clientRepo.findById(input.clientId);
            if (!client)
                throw new Error(`Client with id ${input.clientId} not found`);
            client.accessPointId = input.newAccessPointId;
            await ctx.repositories.clientRepo.save(client);
            return client;
        },
        createIpAddress: async (_, { input }, ctx) => {
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
        assignIp: async (_, { input }, ctx) => {
            const dto = {
                clientId: input.clientId,
                accessPointId: input.accessPointId,
                networkId: input.networkId,
            };
            return ctx.ipAllocation.assignIp.execute(dto);
        },
        releaseIp: async (_, { ipAddressId }, ctx) => {
            await ctx.ipAllocation.releaseIp.execute(ipAddressId);
            return true;
        },
        reserveIp: async (_, { input }, ctx) => {
            const ipAddress = await ctx.repositories.ipAddressRepo.findById(input.ipAddressId);
            if (!ipAddress)
                throw new Error(`IpAddress with id ${input.ipAddressId} not found`);
            ipAddress.reserved = true;
            ipAddress.usageType = input.usageType;
            ipAddress.status = 'reserved';
            await ctx.repositories.ipAddressRepo.save(ipAddress);
            return ipAddress;
        },
        decommissionIp: async (_, { input }, ctx) => {
            const ipAddress = await ctx.repositories.ipAddressRepo.findById(input.ipAddressId);
            if (!ipAddress)
                throw new Error(`IpAddress with id ${input.ipAddressId} not found`);
            ipAddress.status = 'decommissioned';
            ipAddress.active = false;
            await ctx.repositories.ipAddressRepo.save(ipAddress);
            return ipAddress;
        },
        bulkAssignIp: async (_, { input }, ctx) => {
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
        createCpeDevice: async (_, { input }, ctx) => {
            return ctx.signalMonitoring.createCpeDevice.execute(input);
        },
        updateCpeLocation: async (_, { id, coordinates, azimuth }, ctx) => {
            return ctx.signalMonitoring.updateCpeLocation.execute({ id, coordinates, azimuth });
        },
        recordSignalMetric: async (_, { input }, ctx) => {
            return ctx.signalMonitoring.recordSignalMetric.execute(input);
        },
    },
    Base: {
        coordinates: (base) => {
            return base.latitude !== undefined || base.longitude !== undefined
                ? { latitude: base.latitude, longitude: base.longitude, altitude: base.altitude }
                : null;
        },
    },
    AccessPoint: {
        coordinates: (ap) => {
            return ap.latitude !== undefined || ap.longitude !== undefined
                ? { latitude: ap.latitude, longitude: ap.longitude, altitude: ap.altitude }
                : null;
        },
    },
    CpeDevice: {
        coordinates: (cpe) => cpe.coordinates ?? null,
    },
    SignalMetric: {
        evaluation: (metric) => metric.evaluation,
    },
    FieldReport: {
        distanceMeters: (report) => report.distanceMeters ?? report.latestSignal?.distance ?? null,
    },
};
