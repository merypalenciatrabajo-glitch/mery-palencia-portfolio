import { describe, expect, it } from 'vitest';
import {
  canRestoreRoute,
  dismissActiveFormControl,
  parseNativeRoute,
  resolveNativeBackAction,
} from '@/lib/nativeNavigation';

describe('native navigation', () => {
  it('accepts only known routes from the application scheme', () => {
    expect(parseNativeRoute('merypalenciaadmin://app/blog')).toBe('/blog');
    expect(parseNativeRoute('merypalenciaadmin-debug://app/gallery')).toBe('/gallery');
    expect(parseNativeRoute('merypalenciaadmin://app/unknown')).toBeNull();
  });

  it('rejects external hosts, web URLs, credentials and parameters', () => {
    expect(parseNativeRoute('merypalenciaadmin://evil/blog')).toBeNull();
    expect(parseNativeRoute('https://example.com/blog')).toBeNull();
    expect(parseNativeRoute('merypalenciaadmin://app/blog?token=secret')).toBeNull();
    expect(parseNativeRoute('not-a-url')).toBeNull();
  });

  it('restores only authenticated application sections', () => {
    expect(canRestoreRoute('/galeria')).toBe(true);
    expect(canRestoreRoute('/')).toBe(false);
    expect(canRestoreRoute('/login')).toBe(false);
    expect(canRestoreRoute('/unknown')).toBe(false);
  });

  it('returns to the dashboard when a deep link has no internal history', () => {
    expect(resolveNativeBackAction('/blog', false)).toBe('dashboard');
    expect(resolveNativeBackAction('/gallery', true)).toBe('history');
    expect(resolveNativeBackAction('/', false)).toBe('exit');
    expect(resolveNativeBackAction('/login', true)).toBe('exit');
  });

  it('dismisses an active form control before handling native back navigation', () => {
    let blurred = false;
    const input = {
      matches: () => true,
      blur: () => {
        blurred = true;
      },
    };

    expect(dismissActiveFormControl(input)).toBe(true);
    expect(blurred).toBe(true);
    expect(dismissActiveFormControl(null)).toBe(false);
  });
});
