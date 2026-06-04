import { AssignIpDTO } from "@/application/dtos/AssignIpDTO";
import { IpAllocationService } from "@/application/services/IpAllocationService";

export class AssignIpToClientUseCase {
  constructor(private readonly allocationService: IpAllocationService) {}

  async execute(payload: AssignIpDTO) {
    return this.allocationService.allocateToClient(payload);
  }
}
