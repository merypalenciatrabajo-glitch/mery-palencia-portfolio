import { useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { type AppUpdateInfo } from "@/hooks/useAppUpdate";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capawesome-team/capacitor-file-opener";

interface Props {
  update: AppUpdateInfo;
}

type State = "idle" | "downloading" | "done" | "error";

export default function UpdateModal({ update }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  if (dismissed) return null;

  const handleUpdate = async () => {
    setState("downloading");
    setProgress(0);
    setErrorMsg("");

    try {
      const fileName = `admin-update-${update.version}.apk`;

      const progressListener = await Filesystem.addListener("progress", (e) => {
        if (e.contentLength > 0) {
          setProgress(Math.round((e.bytes / e.contentLength) * 100));
        }
      });

      let result;
      try {
        result = await Filesystem.downloadFile({
          url: update.apkUrl,
          path: fileName,
          directory: Directory.Documents,
          progress: true,
        });
      } finally {
        progressListener.remove();
      }

      if (!result.path) throw new Error("No se obtuvo ruta del archivo");

      // Obtener URI pública accesible por el instalador de Android
      const { uri } = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Documents,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <RefreshCw size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Nueva actualización</p>
              <p className="text-xs text-muted-foreground">Versión {update.version} disponible</p>
            </div>
          </div>
          {state !== "downloading" && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
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
