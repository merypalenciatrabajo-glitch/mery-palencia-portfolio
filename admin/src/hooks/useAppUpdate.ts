import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Versión embebida en este APK — se actualiza automáticamente con el script
export const CURRENT_VERSION = "1.6.0";

export interface AppUpdateInfo {
  version: string;
  apkUrl: string;
  changelog?: string;
}

// Retorna true si `remote` es estrictamente mayor que `local`
function isNewerVersion(remote: string, local: string): boolean {
  const r = remote.split(".").map(Number);
  const l = local.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (r[i] !== l[i]) return r[i] > l[i];
  }
  return false;
}

export function useAppUpdate() {
  const [update, setUpdate] = useState<AppUpdateInfo | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "appVersion"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as AppUpdateInfo;
      if (data.version && data.apkUrl && isNewerVersion(data.version, CURRENT_VERSION)) {
        setUpdate(data);
      } else {
        setUpdate(null);
      }
    });
    return unsub;
  }, []);

  return update;
}
