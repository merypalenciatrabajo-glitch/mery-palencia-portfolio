import { describe, expect, it } from "vitest";
import { canEnableOfflinePreview } from "./offlinePreview";

describe("canEnableOfflinePreview", () => {
  it("allows a native debug application id", () => {
    expect(
      canEnableOfflinePreview(true, true, {
        id: "com.merypalencia.admin.debug",
        version: "1.9.0",
      }),
    ).toBe(true);
  });

  it("allows the Android debug version when Capacitor reports the base id", () => {
    expect(
      canEnableOfflinePreview(true, true, {
        id: "com.merypalencia.admin",
        version: "1.9.0-debug",
      }),
    ).toBe(true);
  });

  it.each([
    [false, true, "com.merypalencia.admin.debug", "1.9.0-debug"],
    [true, false, "com.merypalencia.admin.debug", "1.9.0-debug"],
    [true, true, "com.merypalencia.admin", "1.9.0"],
  ])(
    "rejects non-preview or non-debug combinations",
    (requested, isNative, id, version) => {
      expect(canEnableOfflinePreview(requested, isNative, { id, version })).toBe(
        false,
      );
    },
  );
});
