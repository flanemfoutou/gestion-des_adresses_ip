export class AssignIpToClientUseCase {
    allocationService;
    constructor(allocationService) {
        this.allocationService = allocationService;
    }
    async execute(payload) {
        return this.allocationService.allocateToClient(payload);
    }
}
