interface AppIdentity {
  id: string;
  version: string;
}

export const OFFLINE_PREVIEW_EMAIL = "preview-admin@local.test";
export const OFFLINE_PREVIEW_PASSWORD = "offline-preview-only";

export function canEnableOfflinePreview(
  requested: boolean,
  isNative: boolean,
  app: AppIdentity,
) {
  if (!requested || !isNative) return false;

  return app.id.endsWith(".debug") || app.version.endsWith("-debug");
}
