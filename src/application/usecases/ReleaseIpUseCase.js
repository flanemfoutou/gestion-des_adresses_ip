export class ReleaseIpUseCase {
    allocationService;
    constructor(allocationService) {
        this.allocationService = allocationService;
    }
    async execute(ipAddressId) {
        return this.allocationService.releaseIp(ipAddressId);
    }
}
