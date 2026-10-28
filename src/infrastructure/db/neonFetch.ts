function isDnsResolutionError(error: unknown): boolean {
  let current = error;
  while (current instanceof Error) {
    const cause = current as Error & { code?: string; cause?: unknown };
    if (
      cause.code === 'ENOTFOUND' ||
      cause.code === 'EAI_AGAIN' ||
      /getaddrinfo (ENOTFOUND|EAI_AGAIN)/i.test(cause.message)
    ) {
      return true;
    }
    current = cause.cause;
  }
  return false;
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function createDnsRetryFetch(
  fetchImplementation: FetchLike,
  retryDelays = [250, 750],
): FetchLike {
  return async (input, init) => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await fetchImplementation(input, init);
      } catch (error) {
        if (!isDnsResolutionError(error) || attempt >= retryDelays.length) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
      }
    }
  };
}
