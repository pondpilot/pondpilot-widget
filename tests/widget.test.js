import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadPondPilot() {
  vi.resetModules();
  const mod = await import("../src/pondpilot-widget.js");
  return mod.default || mod;
}

describe("PondPilot widget lifecycle", () => {
  let PondPilot;

  beforeEach(async () => {
    document.body.innerHTML = "";
    PondPilot = await loadPondPilot();
    PondPilot.config({ autoInit: false, customThemes: {}, resetQueries: [] });
  });

  it("creates a widget from a <pre> element", () => {
    const pre = document.createElement("pre");
    pre.className = "pondpilot-snippet";
    pre.textContent = "SELECT 42;";
    document.body.appendChild(pre);

    const widget = PondPilot.create(pre);
    expect(widget).toBeTruthy();
    const container = document.querySelector(".pondpilot-widget");
    expect(container).toBeTruthy();
    expect(container.dataset.theme).toBe("light");
    expect(container.dataset.themeMode).toBe("light");
    expect(container.classList.contains("light")).toBe(true);
  });

  it("applies custom themes registered through API", () => {
    PondPilot.registerTheme("sunset", {
      extends: "light",
      config: {
        bgColor: "#ffedd5",
        textColor: "#7c2d12",
        borderColor: "#f97316",
        editorBg: "#fff7ed",
        editorText: "#7c2d12",
        editorFocusBg: "#fed7aa",
        controlsBg: "rgba(249, 115, 22, 0.12)",
        primaryBg: "#f97316",
        primaryText: "#fff",
        primaryHover: "#ea580c",
        secondaryBg: "rgba(249, 115, 22, 0.16)",
        secondaryText: "#7c2d12",
        secondaryHover: "rgba(249, 115, 22, 0.28)",
        mutedText: "#9a3412",
        errorText: "#dc2626",
        errorBg: "rgba(220, 38, 38, 0.08)",
        errorBorder: "rgba(220, 38, 38, 0.2)",
        tableHeaderBg: "rgba(249, 115, 22, 0.16)",
        tableHeaderText: "#7c2d12",
        tableHover: "rgba(249, 115, 22, 0.12)",
        syntaxKeyword: "#c2410c",
        syntaxString: "#047857",
        syntaxNumber: "#7c3aed",
        syntaxComment: "#9a3412",
        syntaxSpecial: "#dc2626",
        syntaxIdentifier: "#facc15",
        fontFamily: "Inter, system-ui, sans-serif",
        editorFontFamily: "'JetBrains Mono', monospace",
        fontSize: "14px",
        editorFontSize: "13px",
        buttonFontSize: "13px",
        metadataFontSize: "12px",
      },
    });

    const pre = document.createElement("pre");
    pre.className = "pondpilot-snippet";
    pre.setAttribute("data-theme", "sunset");
    pre.textContent = "SELECT * FROM duckdb_tables();";
    document.body.appendChild(pre);

    const widget = PondPilot.create(pre);
    expect(widget).toBeTruthy();
    const container = document.querySelector(".pondpilot-widget");
    expect(container.dataset.theme).toBe("sunset");
    expect(container.style.getPropertyValue("--pondpilot-bg-color")).toBe("#ffedd5");
    expect(container.dataset.themeMode).toBe("light");
    expect(container.classList.contains("light")).toBe(true);
  });

  it("applies dark-class styling and loads font imports for extended dark themes", () => {
    PondPilot.registerTheme("retro-terminal", {
      extends: "dark",
      config: {
        bgColor: "#121212",
        textColor: "#eafff2",
        borderColor: "rgba(0, 255, 133, 0.14)",
        editorBg: "#050505",
        editorText: "#eafff2",
        editorFocusBg: "#111b14",
        controlsBg: "rgba(0, 255, 133, 0.14)",
        primaryBg: "#00ff85",
        primaryText: "#0b1f13",
        primaryHover: "#0ddf7d",
        secondaryBg: "rgba(0, 255, 133, 0.12)",
        secondaryText: "#9ef2c3",
        secondaryHover: "rgba(0, 255, 133, 0.2)",
        mutedText: "#94e2b8",
        errorText: "#f87171",
        errorBg: "rgba(248, 113, 113, 0.12)",
        errorBorder: "rgba(248, 113, 113, 0.32)",
        tableHeaderBg: "rgba(0, 255, 133, 0.12)",
        tableHeaderText: "#d1fbee",
        tableHover: "rgba(0, 255, 133, 0.08)",
        syntaxKeyword: "#00ff85",
        syntaxString: "#ff9f1c",
        syntaxNumber: "#2ec4b6",
        syntaxComment: "#94e2b8",
        syntaxSpecial: "#ff6b6b",
        syntaxIdentifier: "#fdffb6",
        fontFamily: "'IBM Plex Mono', 'SFMono-Regular', monospace",
        editorFontFamily: "'IBM Plex Mono', 'SFMono-Regular', monospace",
        fontSize: "14px",
        editorFontSize: "13px",
        buttonFontSize: "13px",
        metadataFontSize: "12px",
        fontImports: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap",
      },
    });

    const pre = document.createElement("pre");
    pre.className = "pondpilot-snippet";
    pre.dataset.theme = "retro-terminal";
    pre.textContent = "SELECT 1;";
    document.body.appendChild(pre);

    const widget = PondPilot.create(pre);
    expect(widget).toBeTruthy();
    const container = document.querySelector(".pondpilot-widget");
    expect(container.dataset.theme).toBe("retro-terminal");
    expect(container.dataset.themeMode).toBe("dark");
    expect(container.classList.contains("dark")).toBe(true);
    expect(container.style.getPropertyValue("--pondpilot-editor-bg")).toBe("#050505");
    expect(container.style.getPropertyValue("--pondpilot-syntax-keyword")).toBe("#00ff85");

    const fontLink = document.head.querySelector('link[rel="stylesheet"][data-pondpilot-font="retro-terminal"]');
    expect(fontLink).toBeTruthy();
    expect(fontLink.getAttribute("href")).toBe(
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap",
    );
  });

  it("waits for external duckdb promise that returns db/module descriptor", async () => {
    const mockModule = {
      DuckDBDataProtocol: { HTTP: "http" },
    };

    const mockConnection = {
      async query() {
        return {
          toArray() {
            return [
              {
                toJSON() {
                  return { value: 1 };
                },
              },
            ];
          },
        };
      },
      async close() {
        return Promise.resolve();
      },
    };

    const connectSpy = vi.fn(async () => mockConnection);
    const mockDB = { connect: connectSpy };

    const externalInstance = Promise.resolve({ db: mockDB, module: mockModule });

    const pre = document.createElement("pre");
    pre.className = "pondpilot-snippet";
    pre.textContent = "SELECT 1;";
    document.body.appendChild(pre);

    const widget = PondPilot.create(pre, {
      duckdbInstance: externalInstance,
    });

    await widget.initDuckDB();

    expect(widget.duckdbReady).toBe(true);
    expect(widget.isExternalInstance).toBe(true);
    expect(connectSpy).toHaveBeenCalled();
    expect(widget.options.duckdbInstance).toBe(mockDB);
    expect(widget.options.duckdbModule).toBe(mockModule);

    await widget.cleanup();
  });

  it("dispatches pondpilot:results events with data", async () => {
    const pre = document.createElement("pre");
    pre.className = "pondpilot-snippet";
    pre.textContent = "SELECT 1;";
    document.body.appendChild(pre);

    const widget = PondPilot.create(pre);
    const container = document.querySelector(".pondpilot-widget");

    const listener = vi.fn();
    container.addEventListener("pondpilot:results", listener);

    widget.displayResults([{ geojson: '{"type":"Polygon"}' }], 5);

    expect(listener).toHaveBeenCalledTimes(1);
    const eventDetail = listener.mock.calls[0][0].detail;
    expect(eventDetail.data[0].geojson).toBe('{"type":"Polygon"}');
    expect(eventDetail.elapsed).toBe(5);
    expect(eventDetail.widget).toBe(container);
  });

  it("runs query with ctrl/cmd + enter shortcut", () => {
    const pre = document.createElement("pre");
    pre.className = "pondpilot-snippet";
    pre.textContent = "SELECT 1;";
    document.body.appendChild(pre);

    const widget = PondPilot.create(pre);
    const runSpy = vi.spyOn(widget, "run").mockResolvedValue();

    const editorPre = document.querySelector(".pondpilot-editor pre");
    const event = new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true });
    editorPre.dispatchEvent(event);

    expect(runSpy).toHaveBeenCalledTimes(1);
  });

  it("executes reset queries when configured", async () => {
    const pre = document.createElement("pre");
    pre.className = "pondpilot-snippet";
    pre.textContent = "SELECT 1;";
    document.body.appendChild(pre);

    const widget = PondPilot.create(pre, { resetQueries: ["DROP TABLE demo;"] });
    const querySpy = vi.fn().mockResolvedValue(undefined);
    const closeSpy = vi.fn().mockResolvedValue(undefined);
    widget.conn = { query: querySpy, close: closeSpy };

    await widget.reset();

    expect(querySpy).toHaveBeenCalledTimes(1);
    expect(querySpy).toHaveBeenCalledWith("DROP TABLE demo;");
    expect(widget.currentCode).toBe(widget.originalCode);
  });

  it("resolves relative file paths via internals helper", () => {
    const map = PondPilot.__internals.resolvePathsInSQL(
      `
        SELECT * FROM 'data/sales.parquet';
        SELECT * FROM read_csv("datasets/users.csv");
      `,
      "https://cdn.example.com/assets",
    );

    expect(map.get("data/sales.parquet")).toBe("https://cdn.example.com/assets/data/sales.parquet");
    expect(map.get("datasets/users.csv")).toBe("https://cdn.example.com/assets/datasets/users.csv");
  });
});
