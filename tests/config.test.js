import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadPondPilot() {
  vi.resetModules();
  const mod = await import("../src/pondpilot-widget.js");
  return mod.default || mod;
}

describe("PondPilot bootstrap configuration", () => {
  it("reads initial config from window globals", async () => {
    vi.resetModules();
    window.PONDPILOT_CONFIG = {
      autoInit: false,
      initQueries: ["INSTALL spatial;"],
      resetQueries: ["DROP TABLE demo;"]
    };
    const mod = await import("../src/pondpilot-widget.js");
    const PondPilot = mod.default || mod;
    const config = PondPilot.getConfig();
    expect(config.autoInit).toBe(false);
    expect(config.initQueries).toEqual(["INSTALL spatial;"]);
    expect(config.resetQueries).toEqual(["DROP TABLE demo;"]);
    delete window.PONDPILOT_CONFIG;
  });
});

describe("PondPilot configuration API", () => {
  let PondPilot;

  beforeEach(async () => {
    document.body.innerHTML = "";
    PondPilot = await loadPondPilot();
    PondPilot.config({ autoInit: false });
  });

  it("normalizes init queries when updating config", () => {
    PondPilot.config({ initQueries: [" INSTALL httpfs ", "LOAD httpfs"] });
    expect(PondPilot.getConfig().initQueries).toEqual(["INSTALL httpfs", "LOAD httpfs"]);
  });

  it("merges custom themes into configuration", () => {
    PondPilot.config({
      customThemes: {
        ocean: {
          extends: "dark",
          config: {
            bgColor: "#001a3d",
            textColor: "#f8fafc",
            borderColor: "#0f172a",
            editorBg: "#021024",
            editorText: "#e2e8f0",
            editorFocusBg: "#031a36",
            controlsBg: "rgba(2, 16, 36, 0.72)",
            primaryBg: "#38bdf8",
            primaryText: "#0f172a",
            primaryHover: "#0ea5e9",
            secondaryBg: "rgba(56, 189, 248, 0.2)",
            secondaryText: "#bae6fd",
            secondaryHover: "rgba(56, 189, 248, 0.3)",
            mutedText: "#94a3b8",
            errorText: "#f87171",
            errorBg: "rgba(248, 113, 113, 0.12)",
            errorBorder: "rgba(248, 113, 113, 0.32)",
            tableHeaderBg: "rgba(148, 163, 184, 0.16)",
            tableHeaderText: "#e2e8f0",
            tableHover: "rgba(56, 189, 248, 0.16)",
            syntaxKeyword: "#38bdf8",
            syntaxString: "#34d399",
            syntaxNumber: "#60a5fa",
            syntaxComment: "#94a3b8",
            syntaxSpecial: "#f97316",
            syntaxIdentifier: "#fbbf24",
            fontFamily: "Inter, system-ui, sans-serif",
            editorFontFamily: "'JetBrains Mono', monospace",
            fontSize: "14px",
            editorFontSize: "13px",
            buttonFontSize: "13px",
            metadataFontSize: "12px",
          },
        },
      },
    });

    const config = PondPilot.getConfig();
    expect(config.customThemes.ocean.config.bgColor).toBe("#001a3d");
  });

  it("exposes internals for testing helpers", () => {
    const internals = PondPilot.__internals;
    expect(internals.normalizeInitQueries(["SELECT 1; ", ""])).toEqual(["SELECT 1;"]);
    const map = internals.resolvePathsInSQL(
      "SELECT * FROM read_parquet('datasets/data.parquet');",
      "https://data.example.com",
    );
    expect(map.get("datasets/data.parquet")).toBe("https://data.example.com/datasets/data.parquet");
  });

  it("normalizes reset queries when updating config", () => {
    PondPilot.config({ resetQueries: [" DROP TABLE demo ; "] });
    expect(PondPilot.getConfig().resetQueries).toEqual(["DROP TABLE demo;"]);
  });
});
