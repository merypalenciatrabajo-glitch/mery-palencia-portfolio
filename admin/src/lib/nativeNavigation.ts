export const ADMIN_ROUTES = new Set([
  '/',
  '/login',
  '/gallery',
  '/galeria',
  '/blog',
  '/commissions',
]);

const NATIVE_PROTOCOLS = new Set([
  'merypalenciaadmin:',
  'merypalenciaadmin-debug:',
]);

export function parseNativeRoute(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (!NATIVE_PROTOCOLS.has(url.protocol) || url.hostname !== 'app') return null;
    if (url.username || url.password || url.search || url.hash) return null;

    const path = url.pathname.replace(/\/+$/, '') || '/';
    return ADMIN_ROUTES.has(path) ? path : null;
  } catch {
    return null;
  }
}

export function canRestoreRoute(path: string | null): path is string {
  return Boolean(path && path !== '/' && path !== '/login' && ADMIN_ROUTES.has(path));
}

export type NativeBackAction = 'history' | 'dashboard' | 'exit';

export function resolveNativeBackAction(
  path: string,
  canGoBack: boolean,
): NativeBackAction {
  if (path === '/' || path === '/login') return 'exit';
  return canGoBack ? 'history' : 'dashboard';
}

type BlurTarget = {
  matches(selector: string): boolean;
  blur(): void;
};

export function dismissActiveFormControl(activeElement: BlurTarget | null) {
  if (!activeElement?.matches('input, textarea, select, [contenteditable="true"]')) {
    return false;
  }

  activeElement.blur();
  return true;
}
