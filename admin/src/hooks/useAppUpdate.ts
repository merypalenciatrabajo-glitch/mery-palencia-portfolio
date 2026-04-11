import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import semver from "semver";

// Versión embebida en este APK — se actualiza automáticamente con el script
export const CURRENT_VERSION = "1.9.0";

export interface AppUpdateInfo {
  version: string;
  apkUrl: string;
  changelog?: string;
}

export function useAppUpdate() {
  const [update, setUpdate] = useState<AppUpdateInfo | null>(null);

  useEffect(() => {
    console.log("[useAppUpdate] CURRENT_VERSION:", CURRENT_VERSION);

    const unsub = onSnapshot(doc(db, "settings", "appVersion"), (snap) => {
      if (!snap.exists()) {
        console.log("[useAppUpdate] No existe el documento settings/appVersion");
        return;
      }

      const data = snap.data() as AppUpdateInfo;
      const latestVersion = data.version;

      console.log("[useAppUpdate] Versión en Firestore:", latestVersion);
      console.log("[useAppUpdate] Versión actual (APK):", CURRENT_VERSION);

      // Validar que ambas versiones sean semver válidas
      if (!semver.valid(latestVersion) || !semver.valid(CURRENT_VERSION)) {
        console.warn("[useAppUpdate] Versión inválida — latestVersion:", latestVersion, "CURRENT_VERSION:", CURRENT_VERSION);
        setUpdate(null);
        return;
      }

      const hasUpdate = semver.gt(latestVersion, CURRENT_VERSION);
      console.log("[useAppUpdate] ¿Hay actualización disponible?", hasUpdate, `(${latestVersion} > ${CURRENT_VERSION})`);

      if (hasUpdate && data.apkUrl) {
        setUpdate(data);
      } else {
        setUpdate(null);
      }
    });

    return unsub;
  }, []);

  return update;
}
