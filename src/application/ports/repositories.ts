import { AccessPoint } from "@/domain/accessPoint/AccessPoint";
import { Client } from "@/domain/client/Client";
import { IpAddress } from "@/domain/ipAddress/IpAddress";
import { IpAssignment } from "@/domain/ipAssignment/IpAssignment";
import { Network } from "@/domain/network/Network";
import { Base } from "@/domain/base/Base";

export interface BaseRepository {
  findById(id: string): Promise<Base | null>;
  findAll(): Promise<Base[]>;
  save(base: Base): Promise<void>;
}

export interface AccessPointRepository {
  findById(id: string): Promise<AccessPoint | null>;
  findByManagementIpId(managementIpId: string): Promise<AccessPoint | null>;
  findByBaseId(baseId: string): Promise<AccessPoint[]>;
  save(accessPoint: AccessPoint): Promise<void>;
}

export interface ClientRepository {
  findById(id: string): Promise<Client | null>;
  findByIpAddressId(ipAddressId: string): Promise<Client | null>;
  findByAccessPointId(accessPointId: string): Promise<Client[]>;
  search(query: string, limit?: number, offset?: number): Promise<Client[]>;
  save(client: Client): Promise<void>;
}

export interface IpAddressRepository {
  findById(id: string): Promise<IpAddress | null>;
  findByAddress(address: string): Promise<IpAddress | null>;
  findAvailableByNetwork(networkId: string, limit?: number, offset?: number): Promise<IpAddress[]>;
  save(ipAddress: IpAddress): Promise<void>;
  listByStatus(status: string, options: { limit: number; offset: number }): Promise<IpAddress[]>;
}

export interface NetworkRepository {
  findById(id: string): Promise<Network | null>;
  findByAccessPointId(accessPointId: string): Promise<Network[]>;
  save(network: Network): Promise<void>;
}

export interface IpAssignmentRepository {
  findById(id: string): Promise<IpAssignment | null>;
  save(assignment: IpAssignment): Promise<void>;
  listHistoryByIp(ipAddressId: string): Promise<IpAssignment[]>;
}
