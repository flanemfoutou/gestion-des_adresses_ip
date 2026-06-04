export class IpCalculatorService {
    /**
     * Parse CIDR notation and calculate all network information
     */
    static fromCidr(cidr) {
        const [ipPart, prefixStr] = cidr.split('/');
        if (!ipPart || !prefixStr) {
            throw new Error(`Invalid CIDR format: ${cidr}`);
        }
        const prefix = parseInt(prefixStr, 10);
        if (prefix < 0 || prefix > 32) {
            throw new Error(`Invalid prefix: ${prefix}. Must be between 0 and 32`);
        }
        const ipBytes = this.ipToBytes(ipPart);
        const mask = this.calculateMask(prefix);
        const wildcardMask = this.calculateWildcardMask(prefix);
        // Calculate network address
        const networkBytes = ipBytes.map((byte, i) => byte & mask[i]);
        const networkAddress = this.bytesToIp(networkBytes);
        // Calculate broadcast address
        const broadcastBytes = ipBytes.map((byte, i) => byte | (255 - mask[i]));
        const broadcastAddress = this.bytesToIp(broadcastBytes);
        // Usable range
        const totalHosts = Math.pow(2, 32 - prefix) - 1;
        const usableStart = this.incrementIp(networkAddress);
        const usableEnd = this.decrementIp(broadcastAddress);
        const subnetMask = this.bytesToIp(mask);
        const wildcardMaskStr = this.bytesToIp(wildcardMask);
        const isPrivate = this.isPrivateAddress(networkAddress);
        return {
            networkAddress,
            broadcastAddress,
            subnetMask,
            wildcardMask: wildcardMaskStr,
            usableStart,
            usableEnd,
            totalHosts,
            prefix,
            isPrivate,
        };
    }
    /**
     * Check if an IP address belongs to a CIDR network
     */
    static isIpInNetwork(ip, cidr) {
        const info = this.fromCidr(cidr);
        const ipBytes = this.ipToBytes(ip);
        const networkBytes = this.ipToBytes(info.networkAddress);
        const broadcastBytes = this.ipToBytes(info.broadcastAddress);
        for (let i = 0; i < 4; i++) {
            if (ipBytes[i] < networkBytes[i] || ipBytes[i] > broadcastBytes[i]) {
                return false;
            }
        }
        return true;
    }
    /**
     * Find the next available IP in a network
     */
    static getNextAvailable(usedIps, cidr) {
        const info = this.fromCidr(cidr);
        const usedSet = new Set(usedIps.map((ip) => this.ipToInt(ip)));
        let current = this.ipToInt(info.usableStart);
        const end = this.ipToInt(info.usableEnd);
        while (current <= end) {
            if (!usedSet.has(current)) {
                return this.intToIp(current);
            }
            current++;
        }
        throw new Error(`No available IPs in ${cidr}`);
    }
    /**
     * Split a network into smaller subnets
     */
    static splitSubnet(cidr, count) {
        if (count < 2 || (count & (count - 1)) !== 0) {
            throw new Error(`Count must be a power of 2, got ${count}`);
        }
        const info = this.fromCidr(cidr);
        const newPrefix = info.prefix + Math.log2(count);
        if (newPrefix > 32) {
            throw new Error(`Cannot split ${cidr} into ${count} subnets: new prefix would be ${newPrefix} (max 32)`);
        }
        const subnets = [];
        const step = Math.pow(2, 32 - newPrefix);
        let current = this.ipToInt(info.networkAddress);
        for (let i = 0; i < count; i++) {
            const subnetIp = this.intToIp(current);
            subnets.push(`${subnetIp}/${Math.floor(newPrefix)}`);
            current += step;
        }
        return subnets;
    }
    /**
     * Summarize (aggregate) multiple CIDR blocks into fewer larger blocks
     */
    static summarize(cidrs) {
        if (cidrs.length === 0)
            return [];
        if (cidrs.length === 1)
            return cidrs;
        const ranges = cidrs.map((cidr) => {
            const info = this.fromCidr(cidr);
            return {
                start: this.ipToInt(info.networkAddress),
                end: this.ipToInt(info.broadcastAddress),
                prefix: info.prefix,
            };
        });
        ranges.sort((a, b) => a.start - b.start);
        const result = [];
        let current = ranges[0];
        for (let i = 1; i < ranges.length; i++) {
            const next = ranges[i];
            if (next.start <= current.end + 1) {
                // Ranges overlap or are adjacent, merge
                current.end = Math.max(current.end, next.end);
            }
            else {
                // Gap found, save current and start new
                result.push(this.rangeToSupernet(current.start, current.end));
                current = next;
            }
        }
        result.push(this.rangeToSupernet(current.start, current.end));
        return result;
    }
    /**
     * Get network statistics
     */
    static getNetworkStats(cidr, usedIps, reservedIps) {
        const info = this.fromCidr(cidr);
        const occupied = usedIps.length;
        const reserved = reservedIps.length;
        const free = info.totalHosts - occupied - reserved;
        return {
            cidr,
            networkAddress: info.networkAddress,
            broadcast: info.broadcastAddress,
            subnetMask: info.subnetMask,
            totalIps: info.totalHosts,
            usableIps: info.totalHosts,
            occupiedIps: occupied,
            reservedIps: reserved,
            freeIps: free,
            occupiedPercentage: (occupied / info.totalHosts) * 100,
            reservedPercentage: (reserved / info.totalHosts) * 100,
            freePercentage: (free / info.totalHosts) * 100,
            isPrivate: info.isPrivate,
        };
    }
    // Private helper methods
    static ipToBytes(ip) {
        const parts = ip.split('.');
        if (parts.length !== 4) {
            throw new Error(`Invalid IP address: ${ip}`);
        }
        return parts.map((part) => {
            const num = parseInt(part, 10);
            if (isNaN(num) || num < 0 || num > 255) {
                throw new Error(`Invalid IP octet: ${part}`);
            }
            return num;
        });
    }
    static bytesToIp(bytes) {
        return bytes.map((b) => (b < 0 ? 256 + b : b).toString()).join('.');
    }
    static ipToInt(ip) {
        const bytes = this.ipToBytes(ip);
        return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
    }
    static intToIp(num) {
        return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255]
            .map((b) => (b < 0 ? 256 + b : b).toString())
            .join('.');
    }
    static calculateMask(prefix) {
        const mask = [0, 0, 0, 0];
        let remaining = prefix;
        for (let i = 0; i < 4; i++) {
            if (remaining >= 8) {
                mask[i] = 255;
                remaining -= 8;
            }
            else if (remaining > 0) {
                mask[i] = (0xff << (8 - remaining)) & 0xff;
                remaining = 0;
            }
        }
        return mask;
    }
    static calculateWildcardMask(prefix) {
        const mask = this.calculateMask(prefix);
        return mask.map((b) => 255 - b);
    }
    static isPrivateAddress(ip) {
        const bytes = this.ipToBytes(ip);
        // 10.0.0.0/8
        if (bytes[0] === 10)
            return true;
        // 172.16.0.0/12
        if (bytes[0] === 172 && bytes[1] >= 16 && bytes[1] <= 31)
            return true;
        // 192.168.0.0/16
        if (bytes[0] === 192 && bytes[1] === 168)
            return true;
        // 127.0.0.0/8 (loopback)
        if (bytes[0] === 127)
            return true;
        return false;
    }
    static incrementIp(ip) {
        return this.intToIp(this.ipToInt(ip) + 1);
    }
    static decrementIp(ip) {
        return this.intToIp(this.ipToInt(ip) - 1);
    }
    static rangeToSupernet(start, end) {
        let prefix = 0;
        let mask = 0xffffffff;
        for (let i = 0; i < 32; i++) {
            const testMask = mask << 1;
            const testStart = start & testMask;
            const testEnd = end & testMask;
            if (testStart !== testEnd)
                break;
            mask = testMask & 0xffffffff;
            prefix++;
        }
        return `${this.intToIp(start & mask)}/32-${prefix}`;
    }
}
