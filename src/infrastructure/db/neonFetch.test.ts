import { describe, expect, test } from 'bun:test';
import { createDnsRetryFetch } from './neonFetch';

describe('createDnsRetryFetch', () => {
  test('retries temporary DNS failures and returns the successful response', async () => {
    let attempts = 0;
    const fetchWithRetry = createDnsRetryFetch(
      async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new TypeError('fetch failed', {
            cause: Object.assign(new Error('getaddrinfo EAI_AGAIN api.neon.tech'), {
              code: 'EAI_AGAIN',
            }),
          });
        }
        return new Response('ok');
      },
      [0],
    );

    const response = await fetchWithRetry('https://api.neon.tech');

    expect(await response.text()).toBe('ok');
    expect(attempts).toBe(2);
  });

  test('does not retry non-DNS errors', async () => {
    let attempts = 0;
    const failure = new Error('request rejected');
    const fetchWithRetry = createDnsRetryFetch(
      async () => {
        attempts += 1;
        throw failure;
      },
      [0, 0],
    );

    await expect(fetchWithRetry('https://api.neon.tech')).rejects.toBe(failure);
    expect(attempts).toBe(1);
  });

  test('surfaces a persistent DNS failure after the bounded retries', async () => {
    let attempts = 0;
    const fetchWithRetry = createDnsRetryFetch(
      async () => {
        attempts += 1;
        throw Object.assign(new Error('DNS lookup failed'), { code: 'ENOTFOUND' });
      },
      [0, 0],
    );

    await expect(fetchWithRetry('https://api.neon.tech')).rejects.toMatchObject({
      code: 'ENOTFOUND',
    });
    expect(attempts).toBe(3);
  });
});
