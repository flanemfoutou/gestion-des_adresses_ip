import { IpAllocationService } from "@/application/services/IpAllocationService";

export class ReleaseIpUseCase {
  constructor(private readonly allocationService: IpAllocationService) {}

  async execute(ipAddressId: string) {
    return this.allocationService.releaseIp(ipAddressId);
  }
}
