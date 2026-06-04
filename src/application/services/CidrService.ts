export class CidrService {
  static ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0);
  }

  static numberToIp(value: number): string {
    return [24, 16, 8, 0].map(shift => (value >> shift) & 255).join('.');
  }

  static parseCidr(cidr: string): { network: string; prefix: number; firstHost: string; lastHost: string } {
    const [network, prefixStr] = cidr.split('/');
    const prefix = Number(prefixStr);
    if (!network || Number.isNaN(prefix) || prefix < 1 || prefix > 32) {
      throw new Error('CIDR must be a valid IPv4 CIDR string');
    }
    const base = this.ipToNumber(network) & (~0 << (32 - prefix));
    const mask = prefix === 32 ? 0xffffffff : ~0 << (32 - prefix);
    const first = base + 1;
    const last = (base | (~mask >>> 0)) - 1;
    return {
      network: this.numberToIp(base),
      prefix,
      firstHost: this.numberToIp(first),
      lastHost: this.numberToIp(last),
    };
  }

  static iterateHosts(cidr: string): string[] {
    const parsed = this.parseCidr(cidr);
    const start = this.ipToNumber(parsed.firstHost);
    const end = this.ipToNumber(parsed.lastHost);
    const hosts: string[] = [];
    for (let n = start; n <= end; n += 1) {
      hosts.push(this.numberToIp(n));
    }
    return hosts;
  }
}
