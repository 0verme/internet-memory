export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_RECORD = 4;
export const MAX_DESCRIPTION_LENGTH = 500;

const MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

export type AllowedImageMimeType = (typeof MIME_BY_EXTENSION)[keyof typeof MIME_BY_EXTENSION];

export type ValidationResult<T> = { valid: true; value: T } | { valid: false; error: string };

export function validateXHandle(input: string): ValidationResult<string> {
  const handle = input.trim().replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9_]{1,15}$/.test(handle)) {
    return { valid: false, error: 'Enter a valid public X handle.' };
  }
  return { valid: true, value: handle };
}

export function validateDescription(input: string): ValidationResult<string> {
  const content = input.trim();
  if (content.length === 0) {
    return { valid: false, error: 'A short description is required.' };
  }
  if (content.length > MAX_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
    };
  }
  return { valid: true, value: content };
}

export function validateXPostUrl(input: string): ValidationResult<string | null> {
  const candidate = input.trim();
  if (candidate.length === 0) {
    return { valid: true, value: null };
  }
  if (candidate.length > 2048) {
    return { valid: false, error: 'Source URL is too long.' };
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { valid: false, error: 'Enter a valid X Post URL.' };
  }

  const allowedHosts = new Set(['x.com', 'twitter.com']);
  const isPostPath =
    /^\/[^/]+\/status\/\d+\/?$/.test(url.pathname) ||
    /^\/i\/web\/status\/\d+\/?$/.test(url.pathname);
  if (
    url.protocol !== 'https:' ||
    !allowedHosts.has(url.hostname.toLowerCase()) ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.port.length > 0 ||
    !isPostPath
  ) {
    return {
      valid: false,
      error: 'Source must be an HTTPS URL to a public X Post.',
    };
  }

  url.hash = '';
  return { valid: true, value: url.toString() };
}

export interface ImageUploadInput {
  filename: string;
  mimeType: string;
  size: number;
  signature: Uint8Array;
}

export interface ValidatedImageUpload {
  mimeType: AllowedImageMimeType;
  extension: 'jpg' | 'png' | 'webp';
  size: number;
}

function hasSignature(signature: Uint8Array, mimeType: AllowedImageMimeType): boolean {
  if (mimeType === 'image/jpeg') {
    return (
      signature.length >= 3 &&
      signature[0] === 0xff &&
      signature[1] === 0xd8 &&
      signature[2] === 0xff
    );
  }
  if (mimeType === 'image/png') {
    const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return pngMagic.every((byte, index) => signature[index] === byte);
  }
  return (
    signature.length >= 12 &&
    String.fromCharCode(...signature.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...signature.slice(8, 12)) === 'WEBP'
  );
}

function hasInvalidFilename(filename: string): boolean {
  return (
    filename.includes('/') ||
    filename.includes('\\') ||
    Array.from(filename).some((character) => {
      const code = character.charCodeAt(0);
      return code <= 0x1f || code === 0x7f;
    })
  );
}

export function validateImageUpload(
  input: ImageUploadInput,
): ValidationResult<ValidatedImageUpload> {
  if (!Number.isSafeInteger(input.size) || input.size < 1 || input.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: 'Image must be between 1 byte and 10 MiB.' };
  }
  if (
    input.filename.length === 0 ||
    input.filename.length > 255 ||
    hasInvalidFilename(input.filename)
  ) {
    return { valid: false, error: 'Filename is not valid.' };
  }

  const extension = input.filename.split('.').at(-1)?.toLowerCase();
  if (!extension || !Object.hasOwn(MIME_BY_EXTENSION, extension)) {
    return {
      valid: false,
      error: 'Only JPG, PNG and WebP images are allowed.',
    };
  }

  const expectedMimeType = MIME_BY_EXTENSION[extension as keyof typeof MIME_BY_EXTENSION];
  if (input.mimeType.toLowerCase() !== expectedMimeType) {
    return {
      valid: false,
      error: 'File extension and MIME type do not match.',
    };
  }
  if (!hasSignature(input.signature, expectedMimeType)) {
    return {
      valid: false,
      error: 'Image bytes do not match the declared file type.',
    };
  }

  const normalizedExtension = expectedMimeType === 'image/jpeg' ? 'jpg' : extension;
  return {
    valid: true,
    value: {
      mimeType: expectedMimeType,
      extension: normalizedExtension as ValidatedImageUpload['extension'],
      size: input.size,
    },
  };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function buildOriginalImageKey(
  createdAt: Date,
  recordId: string,
  attachmentId: string,
  extension: ValidatedImageUpload['extension'],
): string {
  if (Number.isNaN(createdAt.getTime())) {
    throw new Error('A valid creation time is required.');
  }
  if (!UUID_PATTERN.test(recordId) || !UUID_PATTERN.test(attachmentId)) {
    throw new Error('Record and attachment IDs must be server-generated UUIDs.');
  }
  if (!['jpg', 'png', 'webp'].includes(extension)) {
    throw new Error('Unsupported image extension.');
  }
  const year = createdAt.getUTCFullYear().toString().padStart(4, '0');
  const month = (createdAt.getUTCMonth() + 1).toString().padStart(2, '0');
  return `records/${year}/${month}/${recordId}/${attachmentId}.${extension}`;
}

export async function sha256Hex(
  input: ArrayBuffer | Uint8Array,
  cryptoApi: Crypto = crypto,
): Promise<string> {
  const source = input instanceof Uint8Array ? input : new Uint8Array(input);
  const bytes = new Uint8Array(source.byteLength);
  bytes.set(source);
  const digest = await cryptoApi.subtle.digest('SHA-256', bytes.buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
