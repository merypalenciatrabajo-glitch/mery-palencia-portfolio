import { describe, expect, it } from "vitest";
import { loadServerConfig } from "./config";

describe("server configuration validation", () => {
  it("adds local development origins by default", () => {
    const config = loadServerConfig({ NODE_ENV: "development" });
    expect(config.allowedOrigins.has("http://localhost:3000")).toBe(true);
    expect(config.allowedOrigins.has("http://localhost:3001")).toBe(true);
  });

  it("normalizes configured production origins", () => {
    const config = loadServerConfig({
      NODE_ENV: "production",
      CORS_ALLOWED_ORIGINS:
        "https://admin.example.com, https://portfolio.example.com",
    });

    expect([...config.allowedOrigins]).toEqual([
      "https://admin.example.com",
      "https://portfolio.example.com",
    ]);
    expect(config.rateLimitStore).toBe("firestore");
  });

  it("rejects wildcard, path-based and malformed origins", () => {
    expect(() =>
      loadServerConfig({ CORS_ALLOWED_ORIGINS: "*" })
    ).toThrow(/wildcard/);
    expect(() =>
      loadServerConfig({ CORS_ALLOWED_ORIGINS: "https://example.com/path" })
    ).toThrow(/scheme and host/);
    expect(() =>
      loadServerConfig({ CORS_ALLOWED_ORIGINS: "not-a-url" })
    ).toThrow(/Invalid CORS origin/);
  });

  it("rejects unsafe limits and ports", () => {
    expect(() => loadServerConfig({ PORT: "0" })).toThrow(
      /Invalid server configuration/
    );
    expect(() => loadServerConfig({ API_RATE_LIMIT_MAX: "0" })).toThrow(
      /Invalid server configuration/
    );
    expect(() =>
      loadServerConfig({
        REQUEST_TIMEOUT_MS: "5000",
        HEADERS_TIMEOUT_MS: "6000",
      })
    ).toThrow(/HEADERS_TIMEOUT_MS/);
  });

  it("requires an explicit CORS allowlist in production", () => {
    expect(() => loadServerConfig({ NODE_ENV: "production" })).toThrow(
      /CORS_ALLOWED_ORIGINS is required/
    );
  });

  it("loads bounded HTTP timeout defaults and overrides", () => {
    expect(loadServerConfig({}).httpTimeouts).toEqual({
      requestMs: 30_000,
      headersMs: 10_000,
      keepAliveMs: 5_000,
    });
    expect(loadServerConfig({}).rateLimitStore).toBe("memory");

    expect(
      loadServerConfig({
        REQUEST_TIMEOUT_MS: "45000",
        HEADERS_TIMEOUT_MS: "12000",
        KEEP_ALIVE_TIMEOUT_MS: "7000",
      }).httpTimeouts
    ).toEqual({
      requestMs: 45_000,
      headersMs: 12_000,
      keepAliveMs: 7_000,
    });
  });
});
