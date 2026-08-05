import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(resolve(__dirname, "../pages/Dashboard.tsx"), "utf-8");

describe("Dashboard – conteos reales de contenido", () => {
  it("escucha cada colección de forma independiente y en tiempo real", () => {
    expect(dashboardSource).toContain("INITIAL_STATS.map");
    expect(dashboardSource).toContain("onSnapshot(");
    expect(dashboardSource).not.toContain("Promise.all(");
  });

  it("cuenta únicamente documentos destacados en el carrusel Home", () => {
    expect(dashboardSource).toContain('featuredOnly: true');
    expect(dashboardSource).toContain('where("featured", "==", true)');
  });

  it("usa el tamaño real de cada snapshot", () => {
    expect(dashboardSource).toContain("count: snapshot.size");
  });
});
