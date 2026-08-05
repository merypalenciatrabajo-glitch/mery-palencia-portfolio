import { Capacitor } from '@capacitor/core';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import semver from 'semver';
import { db } from '@/lib/firebase';

export const CURRENT_VERSION = "1.9.2";

export interface AppUpdateInfo {
  version: string;
  apkUrl: string;
  sha256: string;
  changelog?: string;
}

const updateBaseUrl = import.meta.env.VITE_ANDROID_UPDATE_BASE_URL?.trim();

export function isTrustedAppUpdate(
  value: unknown,
  trustedBaseUrl = updateBaseUrl,
): value is AppUpdateInfo {
  if (!value || typeof value !== 'object' || !trustedBaseUrl) return false;
  const update = value as Partial<AppUpdateInfo>;
  if (!semver.valid(update.version) || !semver.gt(update.version!, CURRENT_VERSION)) return false;
  if (!/^[a-f0-9]{64}$/i.test(update.sha256 ?? '')) return false;

  try {
    const base = new URL(trustedBaseUrl.endsWith('/') ? trustedBaseUrl : `${trustedBaseUrl}/`);
    const apk = new URL(update.apkUrl ?? '');
    return base.protocol === 'https:' &&
      apk.protocol === 'https:' &&
      !apk.username &&
      !apk.password &&
      apk.href.startsWith(base.href) &&
      apk.pathname.endsWith('.apk');
  } catch {
    return false;
  }
}

export function useAppUpdate() {
  const [update, setUpdate] = useState<AppUpdateInfo | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !updateBaseUrl) return;

    return onSnapshot(
      doc(db, 'settings', 'appVersion'),
      (snapshot) => {
        const data: unknown = snapshot.exists() ? snapshot.data() : null;
        setUpdate(isTrustedAppUpdate(data) ? data : null);
      },
      () => setUpdate(null),
    );
  }, []);

  return update;
}
