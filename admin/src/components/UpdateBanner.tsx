import { useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { type AppUpdateInfo } from "@/hooks/useAppUpdate";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileTransfer } from "@capacitor/file-transfer";
import { FileOpener } from "@capawesome-team/capacitor-file-opener";
import { Capacitor } from "@capacitor/core";

interface Props {
  update: AppUpdateInfo;
}

type State = "idle" | "downloading" | "done" | "error";

async function sha256ForBase64(data: string) {
  const bytes = new Uint8Array(Math.ceil(data.length * 0.75));
  const decoded = atob(data);
  const view = bytes.subarray(0, decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    view[index] = decoded.charCodeAt(index);
  }
  const digest = await crypto.subtle.digest('SHA-256', view);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default function UpdateModal({ update }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  if (!Capacitor.isNativePlatform() || dismissed) return null;

  const handleUpdate = async () => {
    setState("downloading");
    setProgress(0);
    setErrorMsg("");

    try {
      const fileName = `updates/admin-update-${update.version}.apk`;

      await Filesystem.mkdir({
        path: "updates",
        directory: Directory.Cache,
        recursive: true,
      }).catch(() => undefined);

      const { uri: destinationUri } = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Cache,
      });

      const progressListener = await FileTransfer.addListener("progress", (e) => {
        if (e.contentLength > 0) {
          setProgress(Math.round((e.bytes / e.contentLength) * 100));
        }
      });

      try {
        await FileTransfer.downloadFile({
          url: update.apkUrl,
          path: destinationUri,
          progress: true,
        });
      } finally {
        await progressListener.remove();
      }

      const downloaded = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Cache,
      });
      if (typeof downloaded.data !== 'string') throw new Error('No se pudo verificar el archivo descargado');
      const actualSha256 = await sha256ForBase64(downloaded.data);
      if (actualSha256.toLowerCase() !== update.sha256.toLowerCase()) {
        await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache });
        throw new Error('La firma SHA-256 de la actualización no coincide');
      }

      // Obtener URI pública accesible por el instalador de Android
      const { uri } = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Cache,
      });

      setState("done");
      await FileOpener.openFile({
        path: uri,
        mimeType: "application/vnd.android.package-archive",
      });
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Error desconocido");
      setState("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <RefreshCw size={20} className="text-primary" />
            </div>
            <div>
              <p id="update-title" className="font-semibold text-foreground text-sm">Nueva actualización</p>
              <p className="text-xs text-muted-foreground">Versión {update.version} disponible</p>
            </div>
          </div>
          {state !== "downloading" && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              aria-label="Cerrar actualización"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Changelog */}
        {update.changelog && (
          <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2.5">
            {update.changelog}
          </p>
        )}

        {/* Progress */}
        {state === "downloading" && (
          <div className="space-y-1.5">
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{progress}%</p>
          </div>
        )}

        {/* Success */}
        {state === "done" && (
          <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-lg">
            Descarga completa. Sigue las instrucciones para instalar.
          </p>
        )}

        {/* Error */}
        {state === "error" && (
          <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg break-all">
            {errorMsg}
          </p>
        )}

        {/* Botón */}
        <button
          onClick={handleUpdate}
          disabled={state === "downloading" || state === "done"}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Download size={15} />
          {state === "downloading" ? `Descargando ${progress}%` : state === "done" ? "Instalando..." : "Actualizar ahora"}
        </button>

      </div>
    </div>
  );
}
