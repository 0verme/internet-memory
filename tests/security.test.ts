import { describe, expect, it } from 'vitest';
import { createOAuthState, matchesOAuthState, serializeSessionCookie } from '../src/lib/security';

describe('OAuth state helpers', () => {
  it('creates an unpredictable-length base64url state token', () => {
    const state = createOAuthState();
    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('compares fixed-length state tokens and rejects missing or mismatched values', () => {
    const expected = 'a'.repeat(43);
    expect(matchesOAuthState(expected, expected)).toBe(true);
    expect(matchesOAuthState(expected, 'b'.repeat(43))).toBe(false);
    expect(matchesOAuthState('', '')).toBe(false);
    expect(matchesOAuthState('short', 'longer')).toBe(false);
  });
});

describe('session cookie serialization', () => {
  it('sets the required host-only security attributes', () => {
    const cookie = serializeSessionCookie('a'.repeat(43), 3600);
    expect(cookie).toContain('__Host-im_session=');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Max-Age=3600');
    expect(cookie.toLowerCase()).not.toContain('domain=');
  });

  it('rejects malformed tokens and unsafe expiration values', () => {
    expect(() => serializeSessionCookie('bad')).toThrow();
    expect(() => serializeSessionCookie('a'.repeat(43), 0)).toThrow();
  });
});
