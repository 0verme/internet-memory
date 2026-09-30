const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,256}$/;
const OAUTH_STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createOAuthState(
  cryptoApi: Pick<Crypto, 'getRandomValues'> = globalThis.crypto,
): string {
  const bytes = cryptoApi.getRandomValues(new Uint8Array(32));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function matchesOAuthState(expected: string, received: string): boolean {
  if (!OAUTH_STATE_PATTERN.test(expected) || !OAUTH_STATE_PATTERN.test(received)) {
    return false;
  }

  const encoder = new TextEncoder();
  const expectedBytes = encoder.encode(expected);
  const receivedBytes = encoder.encode(received);
  if (expectedBytes.length !== receivedBytes.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < expectedBytes.length; index += 1) {
    difference |= expectedBytes[index] ^ receivedBytes[index];
  }
  return difference === 0;
}

export function serializeSessionCookie(
  token: string,
  maxAgeSeconds = DEFAULT_SESSION_MAX_AGE_SECONDS,
): string {
  if (!SESSION_TOKEN_PATTERN.test(token)) {
    throw new Error('Session token must be an opaque base64url value.');
  }
  if (!Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds <= 0) {
    throw new Error('Session max age must be a positive integer.');
  }

  return `__Host-im_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}
