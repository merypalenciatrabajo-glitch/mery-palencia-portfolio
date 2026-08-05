import { describe, expect, it } from 'vitest';
import { isTrustedAppUpdate } from '@/hooks/useAppUpdate';

const baseUrl = 'https://github.com/mery/repo/releases/download/';
const validUpdate = {
  version: '1.9.2',
  apkUrl: `${baseUrl}v1.9.2/admin-v1.9.2.apk`,
  sha256: 'a'.repeat(64),
};

describe('Android app updates', () => {
  it('accepts a newer checksummed APK from the configured directory', () => {
    expect(isTrustedAppUpdate(validUpdate, baseUrl)).toBe(true);
  });

  it('rejects untrusted hosts, missing hashes and old versions', () => {
    expect(isTrustedAppUpdate({ ...validUpdate, apkUrl: 'https://evil.example/update.apk' }, baseUrl)).toBe(false);
    expect(isTrustedAppUpdate({ ...validUpdate, sha256: '' }, baseUrl)).toBe(false);
    expect(isTrustedAppUpdate({ ...validUpdate, version: '1.9.1' }, baseUrl)).toBe(false);
  });
});
