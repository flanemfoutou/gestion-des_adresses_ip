import { AccessPoint } from "@/domain/accessPoint/AccessPoint";
import { Client } from "@/domain/client/Client";
import { IpAddress } from "@/domain/ipAddress/IpAddress";
import { IpAssignment } from "@/domain/ipAssignment/IpAssignment";
import { Network } from "@/domain/network/Network";
import { Base } from "@/domain/base/Base";
import { CpeDevice } from "@/domain/cpeDevice/CpeDevice";
import { SignalMetric } from "@/domain/signal/SignalMetric";

export interface BaseRepository {
  findById(id: string): Promise<Base | null>;
  findByName(name: string): Promise<Base | null>;
  findByNameAndLocation(name: string, location: string): Promise<Base | null>;
  findAll(): Promise<Base[]>;
  save(base: Base): Promise<void>;
  delete(id: string): Promise<Base | null>;
}

export interface AccessPointRepository {
  findById(id: string): Promise<AccessPoint | null>;
  findAll(): Promise<AccessPoint[]>;
  findByManagementIpId(managementIpId: string): Promise<AccessPoint | null>;
  findByBaseId(baseId: string): Promise<AccessPoint[]>;
  save(accessPoint: AccessPoint): Promise<void>;
}

export interface ClientRepository {
  findById(id: string): Promise<Client | null>;
  findAll(): Promise<Client[]>;
  findByIpAddressId(ipAddressId: string): Promise<Client | null>;
  findByPhoneNumber(phone: string): Promise<Client | null>;
  findByAccessPointId(accessPointId: string): Promise<Client[]>;
  search(query: string, limit?: number, offset?: number): Promise<Client[]>;
  save(client: Client): Promise<void>;
  delete(id: string): Promise<Network | null>;
}

export interface IpAddressRepository {
  findById(id: string): Promise<IpAddress | null>;
  findByAddress(address: string): Promise<IpAddress | null>;
  findAvailableByNetwork(networkId: string, limit?: number, offset?: number): Promise<IpAddress[]>;
  findByStatus(status: string, limit?: number, offset?: number): Promise<IpAddress[]>;
  findByNetworkId(networkId: string, limit?: number, offset?: number): Promise<IpAddress[]>;
  countAvailableByNetwork(networkId: string): Promise<number>;
  countByStatus(status: string): Promise<number>;
  countByNetworkId(networkId: string): Promise<number>;
  /**
   * Return aggregated ip stats for a network
   */
  getNetworkStats(networkId: string): Promise<{ total: number; free: number; occupied: number; reserved: number }>;
  save(ipAddress: IpAddress): Promise<void>;
}

export interface CpeDeviceRepository {
  findById(id: string): Promise<CpeDevice | null>;
  findByClientId(clientId: string): Promise<CpeDevice[]>;
  findByAccessPointId(accessPointId: string): Promise<CpeDevice[]>;
  findAll(): Promise<CpeDevice[]>;
  save(cpeDevice: CpeDevice): Promise<void>;
}

export interface SignalMetricRepository {
  findById(id: string): Promise<SignalMetric | null>;
  findByCpeId(cpeId: string, limit?: number, offset?: number): Promise<SignalMetric[]>;
  findLatestByCpeId(cpeId: string): Promise<SignalMetric | null>;
  save(signalMetric: SignalMetric): Promise<void>;
}

export interface NetworkRepository {
  findById(id: string): Promise<Network | null>;
  findByCidr(cidr: string): Promise<Network | null>;
  findByAccessPointId(accessPointId: string): Promise<Network[]>;
  findAll(): Promise<Network[]>;
  save(network: Network): Promise<void>;
  delete(id: string): Promise<Client | null>;
}

export interface IpAssignmentRepository {
  findById(id: string): Promise<IpAssignment | null>;
  save(assignment: IpAssignment): Promise<void>;
  listHistoryByIp(ipAddressId: string): Promise<IpAssignment[]>;
}
