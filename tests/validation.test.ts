import { describe, expect, it } from 'vitest';
import {
  buildOriginalImageKey,
  MAX_ATTACHMENTS_PER_RECORD,
  MAX_IMAGE_SIZE_BYTES,
  sha256Hex,
  validateDescription,
  validateImageUpload,
  validateXHandle,
  validateXPostUrl,
} from '../src/lib/validation';

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const WEBP_SIGNATURE = new TextEncoder().encode('RIFF0000WEBP');

function validUpload(overrides: Partial<Parameters<typeof validateImageUpload>[0]> = {}) {
  return validateImageUpload({
    filename: 'capture.png',
    mimeType: 'image/png',
    size: 1024,
    signature: PNG_SIGNATURE,
    ...overrides,
  });
}

describe('validateXHandle', () => {
  it('normalizes an optional @ prefix and case', () => {
    expect(validateXHandle(' @Demo_User ')).toEqual({
      valid: true,
      value: 'demo_user',
    });
  });

  it.each(['', '@', 'too-long-handle-123', 'name/other', '@two@handles'])('rejects %s', (value) => {
    expect(validateXHandle(value).valid).toBe(false);
  });
});

describe('validateDescription', () => {
  it('trims valid short descriptions', () => {
    expect(validateDescription('  A public post screenshot.  ')).toEqual({
      valid: true,
      value: 'A public post screenshot.',
    });
  });

  it('rejects blank and overlong descriptions', () => {
    expect(validateDescription('   ').valid).toBe(false);
    expect(validateDescription('x'.repeat(501)).valid).toBe(false);
  });
});

describe('validateXPostUrl', () => {
  it('allows an optional empty source and public X/Twitter status URLs', () => {
    expect(validateXPostUrl('')).toEqual({ valid: true, value: null });
    expect(validateXPostUrl('https://x.com/example/status/123?s=20#post')).toEqual({
      valid: true,
      value: 'https://x.com/example/status/123?s=20',
    });
    expect(validateXPostUrl('https://twitter.com/example/status/123')).toMatchObject({
      valid: true,
    });
    expect(validateXPostUrl('https://x.com/i/web/status/123')).toMatchObject({ valid: true });
  });

  it.each([
    'javascript:alert(1)',
    'http://x.com/example/status/123',
    'https://x.com.evil.test/example/status/123',
    'https://x.com/example/profile',
    'https://user@x.com/example/status/123',
  ])('rejects unsafe or non-post URL %s', (value) => {
    expect(validateXPostUrl(value).valid).toBe(false);
  });
});

describe('validateImageUpload', () => {
  it('accepts PNG, JPEG and WebP only when extension, MIME and bytes agree', () => {
    expect(validUpload().valid).toBe(true);
    expect(
      validUpload({
        filename: 'capture.jpeg',
        mimeType: 'image/jpeg',
        signature: JPEG_SIGNATURE,
      }),
    ).toMatchObject({
      valid: true,
      value: { extension: 'jpg', mimeType: 'image/jpeg' },
    });
    expect(
      validUpload({
        filename: 'capture.webp',
        mimeType: 'image/webp',
        signature: WEBP_SIGNATURE,
      }),
    ).toMatchObject({
      valid: true,
      value: { extension: 'webp', mimeType: 'image/webp' },
    });
  });

  it('rejects MIME spoofing, unsupported formats and size/count overflow', () => {
    expect(
      validUpload({
        filename: 'capture.png',
        mimeType: 'image/png',
        signature: JPEG_SIGNATURE,
      }).valid,
    ).toBe(false);
    expect(validUpload({ filename: 'capture.svg', mimeType: 'image/svg+xml' }).valid).toBe(false);
    expect(validUpload({ size: MAX_IMAGE_SIZE_BYTES + 1 }).valid).toBe(false);
    expect(MAX_ATTACHMENTS_PER_RECORD).toBe(4);
  });
});

describe('original image metadata helpers', () => {
  it('builds a date-partitioned R2 key from UUIDs, not the user filename', () => {
    expect(
      buildOriginalImageKey(
        new Date('2026-09-03T23:30:00-05:00'),
        '123e4567-e89b-42d3-a456-426614174000',
        '987e6543-e21b-43d3-b456-426614174000',
        'png',
      ),
    ).toBe(
      'records/2026/09/123e4567-e89b-42d3-a456-426614174000/987e6543-e21b-43d3-b456-426614174000.png',
    );
  });

  it('hashes the original bytes with SHA-256', async () => {
    expect(await sha256Hex(new TextEncoder().encode('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
