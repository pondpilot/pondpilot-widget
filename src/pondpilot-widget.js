/**
 * PondPilot Widget
 * Transform static SQL code blocks into interactive snippets powered by DuckDB WASM.
 * Feature-rich single-file build with theming, path resolution, and DuckDB init hooks.
 */

(function () {
  "use strict";

  const VERSION = "1.3.1";
  const GLOBAL_NAMESPACE = "PondPilot";
  const STYLE_ELEMENT_ID = "pondpilot-widget-styles";
  const FONT_LINK_ATTRIBUTE = "data-pondpilot-font";
  const FONT_FACE_ATTRIBUTE = "data-pondpilot-font-face";

  const loadedFontImports = new Set();
  const loadedFontFaces = new Set();

  /**
   * Inline sql-highlight library (adapted v4.2.0)
   * Source: https://github.com/scriptcoded/sql-highlight (MIT License)
   */
  const sqlHighlight = (function () {
    const keywords = [
      "SELECT",
      "FROM",
      "WHERE",
      "AND",
      "OR",
      "NOT",
      "IN",
      "EXISTS",
      "BETWEEN",
      "LIKE",
      "IS",
      "NULL",
      "ORDER",
      "BY",
      "GROUP",
      "HAVING",
      "UNION",
      "ALL",
      "LIMIT",
      "OFFSET",
      "FETCH",
      "FIRST",
      "NEXT",
      "ONLY",
      "ROWS",
      "INSERT",
      "INTO",
      "VALUES",
      "UPDATE",
      "SET",
      "DELETE",
      "CREATE",
      "ALTER",
      "DROP",
      "TABLE",
      "INDEX",
      "VIEW",
      "TRIGGER",
      "FUNCTION",
      "PROCEDURE",
      "DATABASE",
      "SCHEMA",
      "PRIMARY",
      "KEY",
      "FOREIGN",
      "REFERENCES",
      "UNIQUE",
      "CHECK",
      "DEFAULT",
      "CONSTRAINT",
      "CASCADE",
      "RESTRICT",
      "IF",
      "CASE",
      "WHEN",
      "THEN",
      "ELSE",
      "END",
      "JOIN",
      "INNER",
      "LEFT",
      "RIGHT",
      "FULL",
      "OUTER",
      "CROSS",
      "ON",
      "AS",
      "DISTINCT",
      "WITH",
      "RECURSIVE",
      "CAST",
      "CONVERT",
      "COALESCE",
      "NULLIF",
      "GREATEST",
      "LEAST",
      "COUNT",
      "SUM",
      "AVG",
      "MIN",
      "MAX",
      "ROUND",
      "FLOOR",
      "CEIL",
      "ABS",
      "SIGN",
      "MOD",
      "SQRT",
      "POWER",
      "EXP",
      "LOG",
      "LN",
      "CONCAT",
      "LENGTH",
      "SUBSTRING",
      "REPLACE",
      "TRIM",
      "UPPER",
      "LOWER",
      "CURRENT_DATE",
      "CURRENT_TIME",
      "CURRENT_TIMESTAMP",
      "EXTRACT",
      "DATE_ADD",
      "DATE_SUB",
      "DATEDIFF",
      "NOW",
      "CURDATE",
      "CURTIME",
    ];

    function getSegments(sqlString) {
      const segments = [];
      const len = sqlString.length;
      let i = 0;

      while (i < len) {
        if (/\s/.test(sqlString[i])) {
          let j = i;
          while (j < len && /\s/.test(sqlString[j])) j++;
          segments.push({ name: "whitespace", content: sqlString.slice(i, j) });
          i = j;
          continue;
        }

        if (sqlString[i] === "-" && sqlString[i + 1] === "-") {
          let j = i + 2;
          while (j < len && sqlString[j] !== "\n") j++;
          segments.push({ name: "comment", content: sqlString.slice(i, j) });
          i = j;
          continue;
        }

        if (sqlString[i] === "/" && sqlString[i + 1] === "*") {
          let j = i + 2;
          while (j < len - 1 && !(sqlString[j] === "*" && sqlString[j + 1] === "/")) j++;
          if (j < len - 1) j += 2;
          segments.push({ name: "comment", content: sqlString.slice(i, j) });
          i = j;
          continue;
        }

        if (sqlString[i] === "'" || sqlString[i] === '"') {
          const quote = sqlString[i];
          let j = i + 1;
          while (j < len && sqlString[j] !== quote) {
            if (sqlString[j] === "\\") j++;
            j++;
          }
          if (j < len) j++;
          segments.push({ name: "string", content: sqlString.slice(i, j) });
          i = j;
          continue;
        }

        if (/\d/.test(sqlString[i])) {
          let j = i;
          while (j < len && /[\d.]/.test(sqlString[j])) j++;
          segments.push({ name: "number", content: sqlString.slice(i, j) });
          i = j;
          continue;
        }

        if (/[a-zA-Z_]/.test(sqlString[i])) {
          let j = i;
          while (j < len && /[a-zA-Z0-9_]/.test(sqlString[j])) j++;
          const word = sqlString.slice(i, j);
          const upperWord = word.toUpperCase();
          if (keywords.includes(upperWord)) {
            segments.push({ name: "keyword", content: word });
          } else {
            segments.push({ name: "identifier", content: word });
          }
          i = j;
          continue;
        }

        if (/[(),.;=<>!+\-*/]/.test(sqlString[i])) {
          segments.push({ name: "special", content: sqlString[i] });
          i++;
          continue;
        }

        if (sqlString[i] === "`") {
          let j = i + 1;
          while (j < len && sqlString[j] !== "`") j++;
          if (j < len) j++;
          segments.push({ name: "identifier", content: sqlString.slice(i, j) });
          i = j;
          continue;
        }

        segments.push({ name: "other", content: sqlString[i] });
        i++;
      }

      return segments;
    }

    function highlight(sqlString, options = {}) {
      const segments = getSegments(sqlString);

      if (options.html) {
        return segments
          .map((segment) => {
            if (segment.name === "whitespace") {
              return segment.content
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            }
            const className = "sql-hl-" + segment.name;
            const escaped = segment.content
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
            return `<span class="${className}">${escaped}</span>`;
          })
          .join("");
      }

      return sqlString;
    }

    return { highlight, getSegments };
  })();

  const CONSTANTS = {
    DEBOUNCE_DELAY: 150,
    LARGE_SQL_THRESHOLD: 500,
    MAX_OUTPUT_HEIGHT: 300,
    MIN_LOADING_DURATION: 200,
    PROGRESS_STEPS: {
      MODULE_LOADING: 10,
      FETCHING_BUNDLES: 20,
      SELECTING_BUNDLE: 30,
      CREATING_WORKER: 40,
      INITIALIZING_DB: 60,
      LOADING_MODULE: 80,
      CREATING_CONNECTION: 90,
      COMPLETE: 100,
    },
  };

  const BUILTIN_THEMES = {
    light: {
      bgColor: "#f8f9fa",
      textColor: "#111827",
      borderColor: "rgba(15, 23, 42, 0.08)",
      editorBg: "#ffffff",
      editorText: "#1f2937",
      editorFocusBg: "#f3f4f6",
      controlsBg: "rgba(248, 250, 252, 0.8)",
      primaryBg: "#3b82f6",
      primaryText: "#ffffff",
      primaryHover: "#2563eb",
      secondaryBg: "rgba(148, 163, 184, 0.16)",
      secondaryText: "#475569",
      secondaryHover: "rgba(148, 163, 184, 0.32)",
      mutedText: "#64748b",
      errorText: "#dc2626",
      errorBg: "rgba(220, 38, 38, 0.08)",
      errorBorder: "rgba(220, 38, 38, 0.2)",
      tableHeaderBg: "rgba(148, 163, 184, 0.16)",
      tableHeaderText: "#334155",
      tableHover: "rgba(148, 163, 184, 0.12)",
      outputBg: "rgba(255, 255, 255, 0.92)",
      syntaxKeyword: "#2563eb",
      syntaxString: "#0f766e",
      syntaxNumber: "#1d4ed8",
      syntaxComment: "#64748b",
      syntaxSpecial: "#dc2626",
      syntaxIdentifier: "#d97706",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      editorFontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
      fontSize: "14px",
      editorFontSize: "13px",
      buttonFontSize: "13px",
      metadataFontSize: "12px",
    },
    dark: {
      bgColor: "#1a1b26",
      textColor: "#e5e7eb",
      borderColor: "rgba(255, 255, 255, 0.08)",
      editorBg: "#0f172a",
      editorText: "#f8fafc",
      editorFocusBg: "#13213d",
      controlsBg: "rgba(15, 23, 42, 0.72)",
      primaryBg: "#3b82f6",
      primaryText: "#f8fafc",
      primaryHover: "#2563eb",
      secondaryBg: "rgba(148, 163, 184, 0.16)",
      secondaryText: "#cbd5f5",
      secondaryHover: "rgba(148, 163, 184, 0.32)",
      mutedText: "#94a3b8",
      errorText: "#f87171",
      errorBg: "rgba(248, 113, 113, 0.12)",
      errorBorder: "rgba(248, 113, 113, 0.32)",
      tableHeaderBg: "rgba(148, 163, 184, 0.12)",
      tableHeaderText: "#e2e8f0",
      tableHover: "rgba(148, 163, 184, 0.08)",
      outputBg: "rgba(17, 19, 33, 0.9)",
      syntaxKeyword: "#7ee787",
      syntaxString: "#a5d6ff",
      syntaxNumber: "#79c0ff",
      syntaxComment: "#8b949e",
      syntaxSpecial: "#ff7b72",
      syntaxIdentifier: "#ffa657",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      editorFontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
      fontSize: "14px",
      editorFontSize: "13px",
      buttonFontSize: "13px",
      metadataFontSize: "12px",
    },
  };

  const REQUIRED_THEME_KEYS = [
    "bgColor",
    "textColor",
    "borderColor",
    "editorBg",
    "editorText",
    "editorFocusBg",
    "controlsBg",
    "primaryBg",
    "primaryText",
    "primaryHover",
    "secondaryBg",
    "secondaryText",
    "secondaryHover",
    "mutedText",
    "errorText",
    "errorBg",
    "errorBorder",
    "tableHeaderBg",
    "tableHeaderText",
    "tableHover",
  ];

  const THEME_VARIABLES = {
    bgColor: "--pondpilot-bg-color",
    textColor: "--pondpilot-text-color",
    borderColor: "--pondpilot-border-color",
    editorBg: "--pondpilot-editor-bg",
    editorText: "--pondpilot-editor-text",
    editorFocusBg: "--pondpilot-editor-focus-bg",
    controlsBg: "--pondpilot-controls-bg",
    primaryBg: "--pondpilot-primary-bg",
    primaryText: "--pondpilot-primary-text",
    primaryHover: "--pondpilot-primary-hover",
    secondaryBg: "--pondpilot-secondary-bg",
    secondaryText: "--pondpilot-secondary-text",
    secondaryHover: "--pondpilot-secondary-hover",
    mutedText: "--pondpilot-muted-text",
    errorText: "--pondpilot-error-text",
    errorBg: "--pondpilot-error-bg",
    errorBorder: "--pondpilot-error-border",
    tableHeaderBg: "--pondpilot-table-header-bg",
    tableHeaderText: "--pondpilot-table-header-text",
    tableHover: "--pondpilot-table-hover",
    outputBg: "--pondpilot-output-bg",
    syntaxKeyword: "--pondpilot-syntax-keyword",
    syntaxString: "--pondpilot-syntax-string",
    syntaxNumber: "--pondpilot-syntax-number",
    syntaxComment: "--pondpilot-syntax-comment",
    syntaxSpecial: "--pondpilot-syntax-special",
    syntaxIdentifier: "--pondpilot-syntax-identifier",
    fontFamily: "--pondpilot-font-family",
    editorFontFamily: "--pondpilot-editor-font-family",
    fontSize: "--pondpilot-font-size",
    editorFontSize: "--pondpilot-editor-font-size",
    buttonFontSize: "--pondpilot-button-font-size",
    metadataFontSize: "--pondpilot-metadata-font-size",
  };

  const DEFAULT_CONFIG = {
    selector: "pre.pondpilot-snippet, .pondpilot-snippet pre",
    baseUrl:
      (typeof window !== "undefined" && window.PONDPILOT_BASE_URL) || "https://app.pondpilot.io",
    theme: "light",
    autoInit: true,
    editable: true,
    duckdbVersion: "1.31.1-dev1.0",
    duckdbCDN: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm",
    duckdbIntegrity: undefined,
    duckdbInstance: undefined,
    duckdbModule: undefined,
    onDuckDBReady: undefined,
    showPoweredBy: true,
    poweredByLabel: "PondPilot",
    initQueries: [],
    resetQueries: [],
    customThemes: {},
  };

  const config = { ...DEFAULT_CONFIG };
  bootstrapWindowConfig();

  function bootstrapWindowConfig() {
    if (typeof window === "undefined") return;
    const initialConfig = window.PONDPILOT_CONFIG;
    if (initialConfig && typeof initialConfig === "object") {
      const normalized = { ...initialConfig };
      if (normalized.initQueries !== undefined) {
        normalized.initQueries = normalizeInitQueries(normalized.initQueries);
      }
      if (normalized.customThemes) {
        normalized.customThemes = mergeCustomThemes(config.customThemes, normalized.customThemes);
      }
      if (normalized.resetQueries !== undefined) {
        normalized.resetQueries = normalizeInitQueries(normalized.resetQueries);
      }
      if (normalized.autoInit !== undefined) {
        normalized.autoInit = Boolean(normalized.autoInit);
      }
      Object.assign(config, normalized);
    }

    if (window.PONDPILOT_INIT_QUERIES !== undefined) {
      config.initQueries = normalizeInitQueries(window.PONDPILOT_INIT_QUERIES);
    }

    if (window.PONDPILOT_RESET_QUERIES !== undefined) {
      config.resetQueries = normalizeInitQueries(window.PONDPILOT_RESET_QUERIES);
    }

    if (window.PONDPILOT_AUTO_INIT !== undefined) {
      config.autoInit = Boolean(window.PONDPILOT_AUTO_INIT);
    }
  }

  let sharedDuckDB = null;
  let duckDBInitPromise = null;
  let duckDBModule = null;
  let duckDBInitQueriesPromise = null;
  let duckDBInitQueriesExecuted = false;
  let duckDBInitQueriesSignature = JSON.stringify(DEFAULT_CONFIG.initQueries);

  const widgetInstances = new WeakMap();
  let mutationObserver = null;

  const FILE_EXTENSIONS = ["parquet", "csv", "json", "arrow", "ndjson"];

  const styles = /* css */ `
    .pondpilot-widget {
      position: relative;
      margin: 1em 0;
      font-family: var(--pondpilot-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      background: var(--pondpilot-bg-color, #f8f9fa);
      color: var(--pondpilot-text-color, #111827);
      font-size: var(--pondpilot-font-size, 14px);
      border: 1px solid var(--pondpilot-border-color, rgba(15, 23, 42, 0.08));
      border-radius: 6px;
      overflow: hidden;
      --pondpilot-brand-offset: calc(env(safe-area-inset-right, 0px) + 28px);
    }

    /* Button container for better layout control */
    .pondpilot-button-container {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 10;
      display: flex;
      gap: 4px;
      pointer-events: none;
    }

    .pondpilot-button-container > * {
      pointer-events: auto;
    }

    /* Minimal floating run button */
    .pondpilot-run-button {
      position: static;
      padding: 4px 12px;
      background: var(--pondpilot-primary-bg, rgba(59, 130, 246, 0.9));
      color: var(--pondpilot-primary-text, #ffffff);
      border: none;
      border-radius: 4px;
      font-size: var(--pondpilot-button-font-size, 12px);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      backdrop-filter: blur(8px);
      white-space: nowrap;
    }

    .pondpilot-run-button:hover {
      background: var(--pondpilot-primary-hover, rgba(37, 99, 235, 0.95));
      transform: translateY(-1px);
    }

    .pondpilot-run-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Reset button in editor */
    .pondpilot-reset-button {
      position: static;
      padding: 4px 8px;
      background: var(--pondpilot-secondaryBg, rgba(107, 114, 128, 0.08));
      color: var(--pondpilot-secondaryText, var(--pondpilot-muted-text, #6b7280));
      border: none;
      border-radius: 4px;
      font-size: var(--pondpilot-button-font-size, 11px);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      opacity: 0;
      visibility: hidden;
      white-space: nowrap;
    }

    .pondpilot-widget:hover .pondpilot-reset-button {
      visibility: visible;
      opacity: 0.4;
    }

    .pondpilot-widget:hover .pondpilot-reset-button.show,
    .pondpilot-reset-button.show:hover {
      opacity: 1;
    }

    .pondpilot-reset-button:hover {
      background: var(--pondpilot-secondaryHover, rgba(107, 114, 128, 0.2));
      color: var(--pondpilot-text-color, #374151);
    }

    .pondpilot-widget.dark .pondpilot-reset-button:hover {
      background: var(--pondpilot-secondaryHover, rgba(255, 255, 255, 0.1));
      color: var(--pondpilot-secondaryText, #e5e7eb);
    }

    /* Clean editor */
    .pondpilot-editor {
      position: relative;
      background: var(--pondpilot-editor-bg, transparent);
      min-height: 60px;
    }

    .pondpilot-editor pre {
      margin: 0;
      padding: 16px;
      padding-right: 90px;
      background: var(--pondpilot-editor-bg, transparent);
      border: none;
      font-family: var(--pondpilot-editor-font-family, 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace);
      font-size: var(--pondpilot-editor-font-size, 13px);
      line-height: 1.6;
      color: var(--pondpilot-editor-text, #24292e);
      white-space: pre-wrap;
      word-wrap: break-word;
      tab-size: 2;
    }

    /* Responsive button spacing for smaller screens */
    @media (max-width: 480px) {
      .pondpilot-editor pre {
        padding-right: 16px;
        padding-top: 48px;
      }
      
      .pondpilot-button-container {
        top: 8px;
        right: 8px;
        left: 8px;
        justify-content: flex-end;
        flex-wrap: wrap;
      }
    }

    .pondpilot-widget.dark .pondpilot-editor pre {
      color: var(--pondpilot-editor-text, #e1e4e8);
    }

    .pondpilot-editor[contenteditable="true"] {
      outline: none;
    }

    .pondpilot-editor pre:focus,
    .pondpilot-editor pre:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 1px var(--pondpilot-primary-bg, rgba(59, 130, 246, 0.35));
      border-radius: 8px;
    }

    .pondpilot-editor[contenteditable="true"]:focus-within {
      background: var(--pondpilot-editor-focus-bg, var(--pondpilot-editor-bg, transparent));
    }

    /* Subtle output */
    .pondpilot-output {
      background: var(--pondpilot-output-bg, rgba(0, 0, 0, 0.02));
      border-top: 1px solid var(--pondpilot-border-color, rgba(0, 0, 0, 0.06));
      max-height: ${CONSTANTS.MAX_OUTPUT_HEIGHT}px;
      overflow: auto;
      display: none;
      font-size: var(--pondpilot-metadata-font-size, 12px);
      color: var(--pondpilot-text-color, #1f2937);
    }

    .pondpilot-widget.dark .pondpilot-output {
      background: var(--pondpilot-output-bg, rgba(17, 19, 33, 0.9));
      border-top-color: var(--pondpilot-border-color, rgba(255, 255, 255, 0.06));
    }

    .pondpilot-output.show {
      display: block;
    }

    .pondpilot-output-content {
      padding: 16px;
    }

    /* Clean tables */
    .pondpilot-output table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--pondpilot-metadata-font-size, 12px);
      background: var(--pondpilot-output-bg, rgba(255, 255, 255, 0.92));
      border: 1px solid var(--pondpilot-border-color, rgba(148, 163, 184, 0.18));
      border-radius: 12px;
      overflow: hidden;
    }

    .pondpilot-widget.dark .pondpilot-output table {
      border-color: var(--pondpilot-border-color, rgba(71, 85, 105, 0.32));
      background: var(--pondpilot-output-bg, rgba(17, 19, 33, 0.85));
    }

    .pondpilot-output th,
    .pondpilot-output td {
      text-align: left;
      padding: 11px 16px;
      border-bottom: 1px solid var(--pondpilot-border-color, rgba(148, 163, 184, 0.14));
    }

    .pondpilot-widget.dark .pondpilot-output th,
    .pondpilot-widget.dark .pondpilot-output td {
      border-bottom-color: var(--pondpilot-border-color, rgba(71, 85, 105, 0.24));
    }

    .pondpilot-output th {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--pondpilot-table-header-text, #485166);
      background: var(--pondpilot-table-header-bg, rgba(148, 163, 184, 0.14));
    }

    .pondpilot-output tbody tr:last-child td {
      border-bottom: none;
    }

    .pondpilot-output tbody tr:hover {
      background: var(--pondpilot-table-hover, rgba(148, 163, 184, 0.12));
    }

    .pondpilot-output td {
      color: var(--pondpilot-text-color, #1f2937);
    }

    .pondpilot-widget.dark .pondpilot-output td {
      color: var(--pondpilot-text-color, #e5e7eb);
    }

    /* Minimal error */
    .pondpilot-error {
      color: var(--pondpilot-error-text, #dc2626);
      padding: 16px;
      font-size: var(--pondpilot-metadata-font-size, 12px);
      font-family: var(--pondpilot-editor-font-family, monospace);
      background: var(--pondpilot-error-bg, rgba(220, 38, 38, 0.08));
      border: 1px solid var(--pondpilot-error-border, rgba(220, 38, 38, 0.2));
      border-radius: 8px;
    }

    /* Simple loading */
    .pondpilot-loading {
      text-align: center;
      padding: 24px;
      color: var(--pondpilot-muted-text, #6b7280);
      font-size: var(--pondpilot-metadata-font-size, 12px);
    }

    /* Loading progress */
    .pondpilot-progress {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px;
    }

    .pondpilot-progress-bar {
      width: 200px;
      height: 4px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .pondpilot-widget.dark .pondpilot-progress-bar {
      background: rgba(255, 255, 255, 0.1);
    }

    .pondpilot-progress-fill {
      height: 100%;
      background: var(--pondpilot-primaryBg, #3b82f6);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .pondpilot-progress-text {
      font-size: var(--pondpilot-metadata-font-size, 12px);
      color: var(--pondpilot-muted-text, #6b7280);
    }

    /* Results footer */
    .pondpilot-results-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--pondpilot-border-color, rgba(0, 0, 0, 0.06));
    }

    .pondpilot-widget.dark .pondpilot-results-footer {
      border-top-color: var(--pondpilot-border-color, rgba(255, 255, 255, 0.06));
    }

    .pondpilot-results-info {
      font-size: var(--pondpilot-metadata-font-size, 11px);
      color: var(--pondpilot-muted-text, #6b7280);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Duck logo watermark */
    .pondpilot-duck {
      position: absolute;
      bottom: 12px;
      right: var(--pondpilot-brand-offset, 28px);
      width: 20px;
      height: 16px;
      opacity: 0.1;
      transition: opacity 0.2s;
      cursor: pointer;
      z-index: 5;
      color: inherit;
      display: block;
    }

    .pondpilot-editor:hover .pondpilot-duck {
      opacity: 0.2;
    }

    .pondpilot-duck:hover {
      opacity: 0.3;
      transform: scale(1.1);
    }

    /* Subtle branding */
    .pondpilot-powered {
      position: absolute;
      bottom: 10px;
      right: calc(var(--pondpilot-brand-offset, 28px) + 36px);
      font-size: var(--pondpilot-metadata-font-size, 10px);
      color: var(--pondpilot-muted-text, #9ca3af);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .pondpilot-editor:hover .pondpilot-powered {
      opacity: 1;
    }

    .pondpilot-powered a {
      color: inherit;
      text-decoration: none;
    }

    .pondpilot-powered a:hover {
      color: var(--pondpilot-primaryBg, #3b82f6);
    }

    /* SQL syntax highlighting */
    .sql-hl-keyword {
      color: var(--pondpilot-syntax-keyword, #0969da);
      font-weight: 600;
    }

    .pondpilot-widget.dark .sql-hl-keyword {
      color: var(--pondpilot-syntax-keyword, #7ee787);
    }

    .sql-hl-string {
      color: var(--pondpilot-syntax-string, #032f62);
    }

    .pondpilot-widget.dark .sql-hl-string {
      color: var(--pondpilot-syntax-string, #a5d6ff);
    }

    .sql-hl-number {
      color: var(--pondpilot-syntax-number, #0550ae);
    }

    .pondpilot-widget.dark .sql-hl-number {
      color: var(--pondpilot-syntax-number, #79c0ff);
    }

    .sql-hl-comment {
      color: var(--pondpilot-syntax-comment, #6e7781);
      font-style: italic;
    }

    .pondpilot-widget.dark .sql-hl-comment {
      color: var(--pondpilot-syntax-comment, #8b949e);
    }

    .sql-hl-special {
      color: var(--pondpilot-syntax-special, #cf222e);
    }

    .pondpilot-widget.dark .sql-hl-special {
      color: var(--pondpilot-syntax-special, #ff7b72);
    }

    .sql-hl-identifier {
      color: var(--pondpilot-syntax-identifier, #953800);
    }

    .pondpilot-widget.dark .sql-hl-identifier {
      color: var(--pondpilot-syntax-identifier, #ffa657);
    }
  `;

  function escapeHtml(unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function debounce(func, wait) {
    let timeout;
    return function debounced(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function ensureStylesInjected() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ELEMENT_ID)) return;
    const styleSheet = document.createElement("style");
    styleSheet.id = STYLE_ELEMENT_ID;
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  function sanitizeQueryEntry(entry) {
    const trimmed = String(entry).trim();
    if (!trimmed) return "";
    return trimmed.replace(/\s*;$/, ";");
  }

  function normalizeInitQueries(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map(sanitizeQueryEntry).filter(Boolean);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.map(sanitizeQueryEntry).filter(Boolean);
          }
        } catch (_error) {
          // Fallback to delimiter parsing
        }
      }
      return trimmed
        .split(/[\r\n;]+/)
        .map(sanitizeQueryEntry)
        .filter(Boolean);
    }
    return [];
  }

  function mergeCustomThemes(...sources) {
    const merged = {};
    sources.forEach((source) => {
      if (!source || typeof source !== "object") return;
      Object.keys(source).forEach((name) => {
        const theme = source[name];
        if (theme && typeof theme === "object") {
          merged[name] = {
            ...(merged[name] || {}),
            ...theme,
            config: {
              ...((merged[name] && merged[name].config) || {}),
              ...(theme.config || {}),
            },
          };
        }
      });
    });
    return merged;
  }

  function coerceStringArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((entry) => (entry === undefined || entry === null ? "" : String(entry).trim()))
        .filter(Boolean);
    }
    return String(value).trim() ? [String(value).trim()] : [];
  }

  function hasConnectMethod(candidate) {
    return !!candidate && typeof candidate.connect === "function";
  }

  function findConnectableInstance(value) {
    if (!value || typeof value !== "object") return null;
    if (hasConnectMethod(value)) {
      return value;
    }
    const candidates = ["db", "instance", "duckdb", "duckDB", "database"];
    for (const key of candidates) {
      if (hasConnectMethod(value[key])) {
        return value[key];
      }
    }
    return null;
  }

  function extractDuckDBModule(value) {
    if (!value || typeof value !== "object") return null;
    if (value.module && typeof value.module === "object") return value.module;
    if (value.duckdbModule && typeof value.duckdbModule === "object") return value.duckdbModule;
    if (value.moduleInstance && typeof value.moduleInstance === "object")
      return value.moduleInstance;
    if (value.duckdb && typeof value.duckdb === "object") return value.duckdb;
    return null;
  }

  function normalizeDuckDBInstance(value) {
    if (!value) {
      return { db: null, module: null };
    }
    if (hasConnectMethod(value)) {
      return { db: value, module: null };
    }
    if (typeof value === "object") {
      const db = findConnectableInstance(value);
      const module = extractDuckDBModule(value);
      return { db, module };
    }
    return { db: null, module: null };
  }

  function validateThemeConfig(configObject) {
    const missing = REQUIRED_THEME_KEYS.filter((key) => !(key in configObject));
    if (missing.length) {
      throw new Error(`Custom theme is missing required keys: ${missing.join(", ")}`);
    }
  }

  function getThemeConfig(themeName, customThemes) {
    const lower = String(themeName).toLowerCase();
    if (BUILTIN_THEMES[lower]) {
      return { ...BUILTIN_THEMES[lower] };
    }

    const themeDef = (customThemes && customThemes[themeName]) || config.customThemes[themeName];
    if (!themeDef) {
      throw new Error(`Unknown PondPilot theme: ${themeName}`);
    }

    const base =
      themeDef.extends && BUILTIN_THEMES[String(themeDef.extends).toLowerCase()]
        ? BUILTIN_THEMES[String(themeDef.extends).toLowerCase()]
        : null;

    const merged = base
      ? { ...base, ...(themeDef.config || themeDef) }
      : { ...(themeDef.config || themeDef) };
    validateThemeConfig(merged);
    return merged;
  }

  function resolveThemeMode(themeName, customThemes, visited = new Set()) {
    if (!themeName) return "light";
    const normalized = String(themeName);
    const lower = normalized.toLowerCase();
    if (visited.has(lower)) return "light";
    visited.add(lower);

    if (lower === "dark") return "dark";
    if (lower === "light") return "light";

    if (BUILTIN_THEMES[lower]) {
      return lower === "dark" ? "dark" : "light";
    }

    const themeDef =
      (customThemes && (customThemes[normalized] || customThemes[lower])) ||
      config.customThemes[normalized] ||
      config.customThemes[lower];

    if (!themeDef || typeof themeDef !== "object") {
      return "light";
    }

    if (typeof themeDef.mode === "string") {
      return themeDef.mode.toLowerCase() === "dark" ? "dark" : "light";
    }

    if (typeof themeDef.isDark === "boolean") {
      return themeDef.isDark ? "dark" : "light";
    }

    if (themeDef.extends) {
      return resolveThemeMode(themeDef.extends, customThemes, visited);
    }

    return "light";
  }

  function ensureThemeFonts(themeName, themeConfig) {
    if (typeof document === "undefined") return;
    if (!themeConfig || typeof themeConfig !== "object") return;

    const imports = coerceStringArray(
      themeConfig.fontImports || themeConfig.fontUrls || themeConfig.fontUrl,
    );
    imports.forEach((href) => {
      if (loadedFontImports.has(href)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      if (themeName) {
        link.setAttribute(FONT_LINK_ATTRIBUTE, themeName);
      }
      document.head.appendChild(link);
      loadedFontImports.add(href);
    });

    const faces = coerceStringArray(themeConfig.fontFaces || themeConfig.fontFace);
    faces.forEach((css) => {
      if (loadedFontFaces.has(css)) return;
      const style = document.createElement("style");
      style.type = "text/css";
      if (themeName) {
        style.setAttribute(FONT_FACE_ATTRIBUTE, themeName);
      }
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);
      loadedFontFaces.add(css);
    });
  }

  function applyTheme(element, themeName, customThemes) {
    if (!element) return;
    try {
      const themeConfig = getThemeConfig(themeName, customThemes);
      element.dataset.theme = themeName;
      const mode = resolveThemeMode(themeName, customThemes);
      element.dataset.themeMode = mode;
      element.classList.toggle("dark", mode === "dark");
      element.classList.toggle("light", mode !== "dark");
      ensureThemeFonts(themeName, themeConfig);
      Object.entries(THEME_VARIABLES).forEach(([key, cssVariable]) => {
        if (themeConfig[key]) {
          element.style.setProperty(cssVariable, themeConfig[key]);
        } else {
          element.style.removeProperty(cssVariable);
        }
      });
    } catch (error) {
      console.warn(error && error.message ? error.message : error);
      const fallbackMode = resolveThemeMode(themeName, customThemes);
      const fallback = fallbackMode === "dark" ? "dark" : "light";
      if (fallback !== themeName) {
        applyTheme(element, fallback, customThemes);
      }
    }
  }

  function resolveThemeName(themePreference) {
    const theme = themePreference || config.theme || "light";
    if (theme === "auto") {
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return "light";
    }
    return theme;
  }

  function extractFilePaths(sql) {
    const paths = new Set();
    const extensions = FILE_EXTENSIONS.join("|");
    const singleQuoteRegex = new RegExp(`'([^']+\\.(?:${extensions}))'`, "gi");
    const doubleQuoteRegex = new RegExp(`"([^"]+\\.(?:${extensions}))"`, "gi");
    const backtickRegex = new RegExp("`([^`]+\\.(?:" + extensions + "))`", "gi");
    const functionRegex = new RegExp(
      `read_(?:parquet|csv|json|ndjson)\\s*\\(\\s*['"]([^'"]+)['"]`,
      "gi",
    );

    let match;
    while ((match = singleQuoteRegex.exec(sql)) !== null) {
      paths.add(match[1]);
    }
    while ((match = doubleQuoteRegex.exec(sql)) !== null) {
      paths.add(match[1]);
    }
    while ((match = backtickRegex.exec(sql)) !== null) {
      paths.add(match[1]);
    }
    while ((match = functionRegex.exec(sql)) !== null) {
      paths.add(match[1]);
    }

    return Array.from(paths);
  }

  function resolvePath(path, baseUrl) {
    if (!path) return path;
    const trimmed = path.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith("/")) {
      if (typeof window !== "undefined" && window.location && window.location.origin) {
        return `${window.location.origin}${trimmed}`;
      }
      return trimmed;
    }

    const normalizedBase =
      baseUrl && baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl || (typeof window !== "undefined" ? window.location.href : "");

    if (!normalizedBase) {
      return trimmed;
    }

    try {
      if (normalizedBase.startsWith("file://")) {
        const host =
          (typeof window !== "undefined" && (window.location.hostname || "localhost")) ||
          "localhost";
        const port = (typeof window !== "undefined" && (window.location.port || "8080")) || "8080";
        return new URL(trimmed.replace(/^\.\//, ""), `http://${host}:${port}/`).href;
      }
      return new URL(trimmed, normalizedBase.endsWith("/") ? normalizedBase : normalizedBase + "/")
        .href;
    } catch (_error) {
      return trimmed.replace(/^\.\//, "");
    }
  }

  function resolvePathsInSQL(sql, baseUrl) {
    const pathMap = new Map();
    const filePaths = extractFilePaths(sql);
    filePaths.forEach((filePath) => {
      const resolved = resolvePath(filePath, baseUrl);
      pathMap.set(filePath, resolved);
    });
    return pathMap;
  }

  function parseBooleanAttribute(value) {
    if (value === null || value === undefined) return undefined;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === "" || normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
    return undefined;
  }

  function getAttribute(element, name) {
    if (!element || typeof element.getAttribute !== "function") return undefined;
    const value = element.getAttribute(name);
    return value === null ? undefined : value;
  }

  function extractOptionsFromElement(element) {
    if (!element) return {};
    const options = {};

    const datasetTheme = getAttribute(element, "data-theme");
    if (datasetTheme) options.theme = datasetTheme;

    const baseUrlAttr = getAttribute(element, "data-base-url");
    if (baseUrlAttr) options.baseUrl = baseUrlAttr;

    const showPoweredByAttr = parseBooleanAttribute(getAttribute(element, "data-show-powered-by"));
    if (showPoweredByAttr !== undefined) options.showPoweredBy = showPoweredByAttr;

    const editableAttr = parseBooleanAttribute(getAttribute(element, "data-editable"));
    if (editableAttr !== undefined) options.editable = editableAttr;

    const initQueriesAttr = getAttribute(element, "data-init-queries");
    if (initQueriesAttr) options.initQueries = normalizeInitQueries(initQueriesAttr);

    const resetQueriesAttr = getAttribute(element, "data-reset-queries");
    if (resetQueriesAttr) options.resetQueries = normalizeInitQueries(resetQueriesAttr);

    return options;
  }

  function sanitizeBaseUrl(url) {
    if (!url) return config.baseUrl;
    try {
      const candidate = new URL(url, window.location.href);
      if (candidate.protocol === "http:" || candidate.protocol === "https:") {
        return candidate.href.replace(/\/$/, "");
      }
    } catch (_err) {
      // Ignore invalid URL
    }
    return config.baseUrl;
  }

  class PondPilotWidget {
    constructor(element, overrides = {}) {
      if (!element || !(element instanceof HTMLElement)) {
        throw new Error("PondPilot.Widget requires a DOM element.");
      }
      this.element = element;
      this.destroyed = false;
      this.widget = null;
      this.editor = null;
      this.output = null;
      this.runButton = null;
      this.resetButton = null;
      this.buttonContainer = null;
      this.poweredBy = null;
      this.duck = null;
      this.conn = null;
      this.currentCode = "";
      this.originalCode = "";
      this.duckdbReady = false;
      this.isExternalInstance = false;
      this.registeredFiles = new Set();
      this.theme = null;
      this.progressCallback = () => {};

      const elementOptions = extractOptionsFromElement(element);
      const {
        customThemes: elementCustomThemes,
        initQueries: elementInitQueries,
        resetQueries: elementResetQueries,
        ...restElementOptions
      } = elementOptions;
      const {
        customThemes: overridesCustomThemes,
        initQueries: overridesInitQueries,
        resetQueries: overridesResetQueries,
        ...restOverrides
      } = overrides || {};

      const mergedCustomThemes = mergeCustomThemes(
        config.customThemes,
        elementCustomThemes,
        overridesCustomThemes,
      );

      const initQueriesFromOverrides =
        overridesInitQueries !== undefined
          ? normalizeInitQueries(overridesInitQueries)
          : elementInitQueries !== undefined
            ? normalizeInitQueries(elementInitQueries)
            : normalizeInitQueries(config.initQueries);

      const resetQueriesFromOverrides =
        overridesResetQueries !== undefined
          ? normalizeInitQueries(overridesResetQueries)
          : elementResetQueries !== undefined
            ? normalizeInitQueries(elementResetQueries)
            : normalizeInitQueries(config.resetQueries);

      this.options = {
        ...config,
        ...restElementOptions,
        ...restOverrides,
        customThemes: mergedCustomThemes,
        initQueries: initQueriesFromOverrides,
        resetQueries: resetQueriesFromOverrides,
      };

      this.options.baseUrl = sanitizeBaseUrl(this.options.baseUrl);

      this.originalCode = this.extractCode();
      this.init();
    }

    extractCode() {
      const pre = this.element.tagName === "PRE" ? this.element : this.element.querySelector("pre");
      const code = pre ? pre.querySelector("code") || pre : this.element;
      return (code && code.textContent ? code.textContent : "").trim();
    }

    resolveTheme() {
      return resolveThemeName(this.options.theme);
    }

    init() {
      ensureStylesInjected();

      this.widget = document.createElement("div");
      this.widget.className = "pondpilot-widget";
      this.widget.dataset.pondpilotWidget = "true";
      this.widget.setAttribute("role", "region");
      this.widget.setAttribute("aria-live", "polite");

      this.theme = this.resolveTheme();
      applyTheme(this.widget, this.theme, this.options.customThemes);

      this.editor = this.createEditor();

      if (this.options.showPoweredBy !== false) {
        this.poweredBy = this.createPoweredBy();
        this.editor.appendChild(this.poweredBy);
        this.duck = this.createDuckLogo();
        this.editor.appendChild(this.duck);
      }

      this.widget.appendChild(this.editor);

      this.buttonContainer = this.createButtonContainer();
      if (this.buttonContainer) {
        this.widget.appendChild(this.buttonContainer);
      }

      this.output = this.createOutput();
      this.widget.appendChild(this.output);

      this.element.dataset.pondpilotWidgetOriginal = "true";
      this.element.parentNode.replaceChild(this.widget, this.element);

      this.duckdbReady = false;
    }

    createButtonContainer() {
      const container = document.createElement("div");
      container.className = "pondpilot-button-container";

      this.resetButton = this.createResetButton();
      container.appendChild(this.resetButton);

      this.runButton = this.createRunButton();
      container.appendChild(this.runButton);

      return container;
    }

    createRunButton() {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pondpilot-run-button";
      button.textContent = "Run";
      button.setAttribute("aria-label", "Run SQL query");
      button.addEventListener("click", () => this.run());
      return button;
    }

    createResetButton() {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pondpilot-reset-button";
      button.textContent = "Reset";
      button.setAttribute("aria-label", "Reset to original SQL");
      button.addEventListener("click", () => this.reset());
      return button;
    }

    getTextNodes(element) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }
      return textNodes;
    }

    getCursorOffset(element, range) {
      const preRange = range.cloneRange();
      preRange.selectNodeContents(element);
      preRange.setEnd(range.endContainer, range.endOffset);
      return preRange.toString().length;
    }

    setCursorOffset(element, offset) {
      const textNodes = this.getTextNodes(element);
      let currentOffset = 0;

      for (const node of textNodes) {
        const nodeLength = node.textContent.length;
        if (currentOffset + nodeLength >= offset) {
          const range = document.createRange();
          const selection = window.getSelection();
          range.setStart(node, offset - currentOffset);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          break;
        }
        currentOffset += nodeLength;
      }
    }

    createEditor() {
      const editor = document.createElement("div");
      editor.className = "pondpilot-editor";

      const pre = document.createElement("pre");
      pre.innerHTML = sqlHighlight.highlight(this.originalCode, { html: true });
      editor.appendChild(pre);

      this.currentCode = this.originalCode;

      if (this.options.editable !== false) {
        pre.contentEditable = "true";
        pre.spellcheck = false;
        pre.setAttribute("role", "textbox");
        pre.setAttribute("aria-label", "SQL editor");
        pre.setAttribute("aria-multiline", "true");

        const renderHighlight = (text, cursorOffset) => {
          pre.innerHTML = sqlHighlight.highlight(text, { html: true });
          this.setCursorOffset(pre, cursorOffset);
          this.toggleResetButton(text !== this.originalCode);
        };

        const applyTextChange = (text, cursorOffset) => {
          this.currentCode = text;
          renderHighlight(text, cursorOffset);
        };

        const highlightDebounced = debounce((text, cursorOffset) => {
          renderHighlight(text, cursorOffset);
        }, CONSTANTS.DEBOUNCE_DELAY);

        pre.addEventListener("input", () => {
          const text = pre.textContent || "";
          this.currentCode = text;
          const selection = window.getSelection();
          const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
          const cursorOffset = range ? this.getCursorOffset(pre, range) : text.length;

          if (text.length < CONSTANTS.LARGE_SQL_THRESHOLD) {
            applyTextChange(text, cursorOffset);
          } else {
            highlightDebounced(text, cursorOffset);
          }
        });

        pre.addEventListener("keydown", (event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            this.run();
            return;
          }

          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) {
            return;
          }

          if (event.key === "Tab") {
            event.preventDefault();
            const range = selection.getRangeAt(0);
            const cursorOffset = this.getCursorOffset(pre, range);
            const text = pre.textContent || "";
            const lineStart = text.lastIndexOf("\n", cursorOffset - 1) + 1;

            if (event.shiftKey) {
              const leading = text.slice(lineStart, cursorOffset);
              if (leading.startsWith("\t")) {
                applyTextChange(
                  text.slice(0, lineStart) + leading.slice(1) + text.slice(cursorOffset),
                  cursorOffset - 1,
                );
              } else if (leading.startsWith("  ")) {
                applyTextChange(
                  text.slice(0, lineStart) + leading.slice(2) + text.slice(cursorOffset),
                  cursorOffset - 2,
                );
              }
              return;
            }

            const insert = "\t";
            applyTextChange(
              text.slice(0, cursorOffset) + insert + text.slice(cursorOffset),
              cursorOffset + insert.length,
            );
            return;
          }

          if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            const range = selection.getRangeAt(0);
            const cursorOffset = this.getCursorOffset(pre, range);
            const text = pre.textContent || "";
            const lineStart = text.lastIndexOf("\n", cursorOffset - 1) + 1;
            const leading = text.slice(lineStart, cursorOffset);
            const indentMatch = leading.match(/^[\t ]*/);
            const indent = event.shiftKey ? "" : indentMatch ? indentMatch[0] : "";
            const insert = "\n" + indent;
            applyTextChange(
              text.slice(0, cursorOffset) + insert + text.slice(cursorOffset),
              cursorOffset + insert.length,
            );
          }
        });
      }

      return editor;
    }

    toggleResetButton(show) {
      if (!this.resetButton) return;
      if (show) {
        this.resetButton.classList.add("show");
      } else {
        this.resetButton.classList.remove("show");
      }
    }

    createOutput() {
      const output = document.createElement("div");
      output.className = "pondpilot-output";
      output.setAttribute("aria-live", "polite");
      output.setAttribute("aria-label", "Query results");

      const content = document.createElement("div");
      content.className = "pondpilot-output-content";
      output.appendChild(content);
      return output;
    }

    createPoweredBy() {
      const container = document.createElement("div");
      container.className = "pondpilot-powered";
      container.textContent = "Powered by ";

      const link = document.createElement("a");
      const label = this.options.poweredByLabel || "PondPilot";
      const safeBaseUrl = sanitizeBaseUrl(this.options.baseUrl);

      link.href = safeBaseUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = label;

      container.appendChild(link);
      return container;
    }

    createDuckLogo() {
      const link = document.createElement("a");
      link.className = "pondpilot-duck";
      link.href = sanitizeBaseUrl(this.options.baseUrl);
      link.target = "_blank";
      link.rel = "noopener";
      link.setAttribute("aria-label", "Open PondPilot");
      link.innerHTML = `
        <svg viewBox="0 0 51 42" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.5 42C6.04416 42 0 35.9558 0 28.5C0 21.0442 6.04415 15 13.5 15H25.5C32.9558 15 39 21.0442 39 28.5C39 35.9558 32.9558 42 25.5 42H13.5Z" fill-opacity="0.32"/>
          <path d="M31.5 27C24.0442 27 18 20.9558 18 13.5C18 6.04416 24.0442 0 31.5 0C38.9558 0 45 6.04416 45 13.5C45 20.9558 38.9558 27 31.5 27Z"/>
          <path d="M43.5 15C44.3284 15 45 14.3284 45 13.5C45 12.6716 44.3284 12 43.5 12C42.6716 12 42 12.6716 42 13.5C42 14.3284 42.6716 15 43.5 15Z"/>
          <path d="M31.5 15C32.3284 15 33 14.3284 33 13.5C33 12.6716 32.3284 12 31.5 12C30.6716 12 30 12.6716 30 13.5C30 14.3284 30.6716 15 31.5 15Z"/>
          <path d="M37.5 24C35.0147 24 33 21.9853 33 19.5C33 17.0147 35.0147 15 37.5 15H46.5C48.9853 15 51 17.0147 51 19.5C51 21.9853 48.9853 24 46.5 24H37.5Z"/>
          <path d="M30.8908 28.971C30.7628 30.9568 29.94 32.9063 28.4223 34.424C25.1074 37.7388 19.733 37.7388 16.4181 34.424L10.418 28.4238L16.4179 22.4239C19.7327 19.1091 25.1072 19.1091 28.422 22.4239C30.2181 24.22 31.0411 26.6208 30.8908 28.971Z" fill-opacity="0.32"/>
        </svg>
      `;
      return link;
    }

    async initDuckDB() {
      try {
        this.runButton.textContent = "Loading...";
        this.runButton.disabled = true;
        this.widget.setAttribute("aria-busy", "true");

        if (this.options.duckdbInstance) {
          this.isExternalInstance = true;
          let externalInstance = this.options.duckdbInstance;

          this.showProgress(
            "Waiting for DuckDB instance...",
            CONSTANTS.PROGRESS_STEPS.FETCHING_BUNDLES,
          );

          if (externalInstance && typeof externalInstance.then === "function") {
            externalInstance = await externalInstance;
            this.options.duckdbInstance = externalInstance;
          }

          const normalized = normalizeDuckDBInstance(externalInstance);

          if (normalized.module) {
            duckDBModule = normalized.module;
          } else if (this.options.duckdbModule) {
            duckDBModule = this.options.duckdbModule;
          } else if (!duckDBModule && typeof window !== "undefined" && window.duckdb) {
            duckDBModule = window.duckdb;
          }

          if (duckDBModule) {
            this.options.duckdbModule = duckDBModule;
          }

          if (normalized.db) {
            sharedDuckDB = normalized.db;
            this.options.duckdbInstance = normalized.db;
          } else {
            sharedDuckDB = externalInstance;
          }

          let retries = 0;
          while (!sharedDuckDB || typeof sharedDuckDB.connect !== "function") {
            if (retries > 50) throw new Error("DuckDB instance not ready after waiting");
            retries++;
            await new Promise((resolve) => setTimeout(resolve, 100));
            const latest = normalizeDuckDBInstance(this.options.duckdbInstance);
            if (latest.db && typeof latest.db.connect === "function") {
              sharedDuckDB = latest.db;
              this.options.duckdbInstance = latest.db;
            }
            if (!duckDBModule && latest.module) {
              duckDBModule = latest.module;
              this.options.duckdbModule = duckDBModule;
            }
          }

          this.showProgress(
            "Connecting to DuckDB instance...",
            CONSTANTS.PROGRESS_STEPS.CREATING_CONNECTION,
          );
        } else {
          this.showProgress("Initializing DuckDB...", CONSTANTS.PROGRESS_STEPS.MODULE_LOADING);

          if (!duckDBInitPromise) {
            duckDBInitPromise = this.createSharedDuckDB((percent, message) => {
              this.showProgress(message, percent);
            });
          }

          await duckDBInitPromise;
          this.showProgress("Creating connection...", CONSTANTS.PROGRESS_STEPS.CREATING_CONNECTION);
        }

        this.conn = await sharedDuckDB.connect();

        if (!this.isExternalInstance) {
          await this.executeInitQueries();
        }

        this.duckdbReady = true;
        this.runButton.textContent = "Run";
        this.runButton.disabled = false;
        this.output.classList.remove("show");
        this.widget.setAttribute("aria-busy", "false");

        if (!this.isExternalInstance && this.options.onDuckDBReady) {
          try {
            this.options.onDuckDBReady(sharedDuckDB, duckDBModule);
          } catch (callbackError) {
            console.warn("onDuckDBReady callback errored:", callbackError);
          }
        }
      } catch (error) {
        console.error("Failed to initialize DuckDB:", error);
        this.runButton.textContent = "Error";
        this.showError(
          "Failed to initialize DuckDB: " +
            (error && error.message ? error.message : String(error)),
        );
        this.widget.setAttribute("aria-busy", "false");
      }
    }

    async executeInitQueries() {
      const queries = normalizeInitQueries(this.options.initQueries);
      if (!queries.length || !this.conn) return;

      const signature = JSON.stringify(queries);
      if (duckDBInitQueriesExecuted) {
        if (signature !== duckDBInitQueriesSignature) {
          console.warn(
            "DuckDB init queries already executed; updates will not take effect until page reload.",
          );
        }
        return;
      }

      let progressVisible = false;
      const showInitProgress = (message) => {
        progressVisible = true;
        this.showProgress(message, CONSTANTS.PROGRESS_STEPS.COMPLETE - 5);
      };

      const clearInitProgress = () => {
        if (!progressVisible) return;
        const content = this.output.querySelector(".pondpilot-output-content");
        if (content) content.innerHTML = "";
        this.output.classList.remove("show");
        progressVisible = false;
      };

      if (duckDBInitQueriesPromise) {
        showInitProgress("Waiting for initialization queries...");
        try {
          await duckDBInitQueriesPromise;
        } finally {
          clearInitProgress();
        }
        return;
      }

      duckDBInitQueriesSignature = signature;
      duckDBInitQueriesPromise = (async () => {
        for (let index = 0; index < queries.length; index++) {
          const query = queries[index];
          try {
            await this.conn.query(query);
          } catch (error) {
            console.error(`Init query failed (${index + 1}/${queries.length}): ${query}`, error);
            throw error;
          }
        }
        duckDBInitQueriesExecuted = true;
      })();

      showInitProgress("Running initialization queries...");
      try {
        await duckDBInitQueriesPromise;
      } finally {
        duckDBInitQueriesPromise = null;
        clearInitProgress();
      }
    }

    async executeResetQueries(queries) {
      const list = Array.isArray(queries) ? queries : normalizeInitQueries(queries);
      if (!list.length || !this.conn) return;

      const progressFloor = CONSTANTS.PROGRESS_STEPS.CREATING_CONNECTION;
      const progressRange = CONSTANTS.PROGRESS_STEPS.COMPLETE - progressFloor;

      try {
        for (let index = 0; index < list.length; index++) {
          const percent = progressFloor + Math.round(((index + 1) / list.length) * progressRange);
          this.showProgress(`Running reset queries (${index + 1}/${list.length})...`, percent);
          await this.conn.query(list[index]);
        }
      } finally {
        const content = this.output.querySelector(".pondpilot-output-content");
        if (content) content.innerHTML = "";
        this.output.classList.remove("show");
      }
    }

    showProgress(message, percent) {
      const outputContent = this.output.querySelector(".pondpilot-output-content");
      const safePercent = Math.min(100, Math.max(0, percent || 0));
      outputContent.innerHTML = `
        <div class="pondpilot-progress" role="status" aria-live="polite">
          <div class="pondpilot-progress-text">${escapeHtml(message || "Loading...")}</div>
          <div class="pondpilot-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${safePercent}">
            <div class="pondpilot-progress-fill" style="width: ${safePercent}%"></div>
          </div>
        </div>
      `;
      this.output.classList.add("show");
    }

    async createSharedDuckDB(progressCallback) {
      try {
        this.progressCallback = progressCallback || (() => {});
        this.progressCallback(CONSTANTS.PROGRESS_STEPS.MODULE_LOADING, "Loading DuckDB module...");
        const duckdbUrl = `${config.duckdbCDN}@${config.duckdbVersion}/+esm`;
        duckDBModule = await import(/* @vite-ignore */ duckdbUrl);
        const duckdb = duckDBModule;

        this.progressCallback(CONSTANTS.PROGRESS_STEPS.FETCHING_BUNDLES, "Fetching bundles...");
        const bundles = duckdb.getJsDelivrBundles();

        this.progressCallback(
          CONSTANTS.PROGRESS_STEPS.SELECTING_BUNDLE,
          "Selecting best bundle...",
        );
        const bundle = await duckdb.selectBundle(bundles);
        this.progressCallback(CONSTANTS.PROGRESS_STEPS.CREATING_WORKER, "Creating worker...");

        let worker = null;
        try {
          const workerResponse = await fetch(bundle.mainWorker);
          if (!workerResponse.ok) {
            throw new Error(
              `Failed to fetch worker: ${workerResponse.status} ${workerResponse.statusText}`,
            );
          }
          const workerScript = await workerResponse.text();
          const workerBlob = new Blob([workerScript], { type: "application/javascript" });
          const workerUrl = URL.createObjectURL(workerBlob);
          worker = new Worker(workerUrl);
          setTimeout(() => URL.revokeObjectURL(workerUrl), 1000);
        } catch (fetchError) {
          try {
            worker = new Worker(bundle.mainWorker);
          } catch (_directError) {
            const workerUrl = URL.createObjectURL(
              new Blob([`importScripts("${bundle.mainWorker}");`], {
                type: "application/javascript",
              }),
            );
            worker = new Worker(workerUrl);
          }
        }

        const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
        this.progressCallback(CONSTANTS.PROGRESS_STEPS.INITIALIZING_DB, "Initializing DuckDB...");
        sharedDuckDB = new duckdb.AsyncDuckDB(logger, worker);

        this.progressCallback(
          CONSTANTS.PROGRESS_STEPS.LOADING_MODULE,
          "Loading PondPilot module...",
        );
        await sharedDuckDB.instantiate(bundle.mainModule, bundle.pthreadWorker);
        this.progressCallback(CONSTANTS.PROGRESS_STEPS.COMPLETE, "Ready!");

        return sharedDuckDB;
      } catch (error) {
        duckDBInitPromise = null;
        throw error;
      }
    }

    async processSQLFileReferences(sql) {
      if (!this.conn || !duckDBModule || !duckDBModule.DuckDBDataProtocol) {
        return sql;
      }
      const pathMap = resolvePathsInSQL(sql, this.options.baseUrl);
      for (const [original, resolved] of pathMap.entries()) {
        if (!original || !resolved) continue;
        if (this.registeredFiles.has(original)) continue;
        try {
          await sharedDuckDB.registerFileURL(
            original,
            resolved,
            duckDBModule.DuckDBDataProtocol.HTTP,
            false,
          );
          this.registeredFiles.add(original);
        } catch (error) {
          console.warn(`Failed to register ${original} (${resolved})`, error);
        }
      }
      return sql;
    }

    async processRelativeParquetPaths(sql) {
      console.warn(
        "processRelativeParquetPaths is deprecated; using processSQLFileReferences instead.",
      );
      return this.processSQLFileReferences(sql);
    }

    async run() {
      const pre = this.editor.querySelector("pre");
      const code = this.currentCode || (pre && pre.textContent ? pre.textContent.trim() : "");
      if (!code) return;

      if (!this.duckdbReady) {
        await this.initDuckDB();
        if (!this.duckdbReady) return;
      }

      this.runButton.disabled = true;
      this.runButton.textContent = "Running...";
      this.output.classList.add("show");
      this.widget.setAttribute("aria-busy", "true");

      const outputContent = this.output.querySelector(".pondpilot-output-content");
      outputContent.innerHTML = '<div class="pondpilot-loading">Running query...</div>';
      const loadingStart = performance.now();

      try {
        const processed = await this.processSQLFileReferences(code);
        const queryStart = performance.now();
        const result = await this.conn.query(processed);
        const elapsed = Math.round(performance.now() - queryStart);

        const loadingElapsed = performance.now() - loadingStart;
        const remainingTime = Math.max(0, CONSTANTS.MIN_LOADING_DURATION - loadingElapsed);
        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        this.displayResults(
          result.toArray().map((row) => row.toJSON()),
          elapsed,
        );
        this.runButton.textContent = "Run";
      } catch (error) {
        console.error("Query failed:", error);
        const loadingElapsed = performance.now() - loadingStart;
        const remainingTime = Math.max(0, CONSTANTS.MIN_LOADING_DURATION - loadingElapsed);
        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }
        this.showError(error && error.message ? error.message : String(error));
        this.runButton.textContent = "Run";
      } finally {
        this.runButton.disabled = false;
        this.widget.setAttribute("aria-busy", "false");
      }
    }

    displayResults(data, elapsed) {
      const outputContent = this.output.querySelector(".pondpilot-output-content");

      if (!data || data.length === 0) {
        outputContent.innerHTML =
          '<div style="text-align:center; color: var(--pondpilot-muted-text, #64748b);">No results</div>';
        return;
      }

      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      Object.keys(data[0]).forEach((key) => {
        const th = document.createElement("th");
        th.textContent = key;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      data.forEach((row) => {
        const tr = document.createElement("tr");
        Object.values(row).forEach((value) => {
          const td = document.createElement("td");
          td.textContent = value === null ? "null" : String(value);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      const metadata = document.createElement("div");
      metadata.style.marginBottom = "12px";
      metadata.style.fontSize = "var(--pondpilot-metadata-font-size, 12px)";
      metadata.style.color = "var(--pondpilot-muted-text, #64748b)";
      metadata.textContent = `Returned ${data.length} row${data.length === 1 ? "" : "s"} in ${elapsed} ms`;

      outputContent.innerHTML = "";
      outputContent.appendChild(metadata);
      outputContent.appendChild(table);
      this.output.classList.add("show");

      try {
        const event = new CustomEvent("pondpilot:results", {
          detail: { data, elapsed, widget: this.widget },
          bubbles: true,
        });
        this.widget.dispatchEvent(event);
      } catch (error) {
        console.warn("Failed to dispatch pondpilot:results event", error);
      }
    }

    showError(message) {
      const outputContent = this.output.querySelector(".pondpilot-output-content");
      let improvedMessage = message || "Unknown error";
      let suggestion = "";

      if (message.includes("NoSuchFile") || message.includes("ENOENT")) {
        improvedMessage = "File not found";
        suggestion =
          "Check that the referenced file exists and is reachable from the configured baseUrl.";
      } else if (message.includes("HTTP") && message.includes("403")) {
        improvedMessage = "Access denied (403)";
        suggestion = "Verify CORS headers or authentication for the requested file.";
      } else if (message.includes("HTTP") && message.includes("404")) {
        improvedMessage = "File not found (404)";
        suggestion = "Ensure the resolved URL is correct and the file is publicly accessible.";
      } else if (message.includes("Out of Memory")) {
        improvedMessage = "Memory limit exceeded";
        suggestion = "Consider limiting the dataset or using a WHERE clause to reduce result size.";
      }

      outputContent.innerHTML = `
        <div class="pondpilot-error" role="alert">
          <div>${escapeHtml(improvedMessage)}</div>
          ${suggestion ? `<div style="margin-top:8px; opacity:0.8; font-size: var(--pondpilot-metadata-font-size, 12px);">${escapeHtml(suggestion)}</div>` : ""}
        </div>
      `;
      this.output.classList.add("show");
      this.toggleResetButton(true);
    }

    async reset() {
      const pre = this.editor.querySelector("pre");
      if (!pre) return;

      const resetButton = this.resetButton;
      if (resetButton) resetButton.disabled = true;
      this.widget.setAttribute("aria-busy", "true");

      try {
        const resetQueries = normalizeInitQueries(this.options.resetQueries || []);
        if (this.conn && resetQueries.length) {
          await this.executeResetQueries(resetQueries);
        }

        pre.innerHTML = sqlHighlight.highlight(this.originalCode, { html: true });
        this.currentCode = this.originalCode;
        this.toggleResetButton(false);
        const content = this.output.querySelector(".pondpilot-output-content");
        if (content) content.innerHTML = "";
        this.output.classList.remove("show");
      } catch (error) {
        console.error("Reset queries failed:", error);
        this.showError(
          "Reset failed: " + (error && error.message ? error.message : String(error)),
        );
        return;
      } finally {
        if (resetButton) resetButton.disabled = false;
        this.widget.setAttribute("aria-busy", "false");
      }
    }

    async cleanup() {
      try {
        if (this.conn) {
          await this.conn.close();
          this.conn = null;
        }
        this.registeredFiles.clear();
      } catch (error) {
        console.warn("Failed to cleanup widget:", error);
      }
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;

      this.cleanup().catch((error) => console.error("Cleanup error:", error));

      widgetInstances.delete(this.widget);

      this.widget = null;
      this.editor = null;
      this.output = null;
      this.runButton = null;
      this.resetButton = null;
      this.buttonContainer = null;
      this.poweredBy = null;
      this.duck = null;
    }
  }

  function ensureMutationObserver() {
    if (
      mutationObserver ||
      typeof MutationObserver === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.classList.contains("pondpilot-widget")) {
            const widget = widgetInstances.get(node);
            if (widget) widget.destroy();
            return;
          }
          const descendants = node.querySelectorAll
            ? node.querySelectorAll(".pondpilot-widget")
            : [];
          descendants.forEach((element) => {
            const widget = widgetInstances.get(element);
            if (widget) widget.destroy();
          });
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function collectElements(target) {
    if (typeof document === "undefined") return [];
    if (!target) {
      return Array.from(document.querySelectorAll(config.selector));
    }
    if (typeof target === "string") {
      return Array.from(document.querySelectorAll(target));
    }
    if (target instanceof HTMLElement) {
      return [target];
    }
    if (NodeList.prototype.isPrototypeOf(target) || Array.isArray(target)) {
      return Array.from(target).filter((item) => item instanceof HTMLElement);
    }
    return [];
  }

  function init(target, overrides) {
    if (typeof document === "undefined") return [];
    ensureStylesInjected();
    ensureMutationObserver();
    const elements = collectElements(target);
    const widgets = [];
    elements.forEach((element) => {
      if (element.dataset.pondpilotWidget === "true") return;
      const widget = new PondPilotWidget(element, overrides || {});
      if (widget.widget) {
        widgetInstances.set(widget.widget, widget);
        widgets.push(widget);
      }
    });
    return widgets;
  }

  function destroy(target) {
    if (typeof document === "undefined") return;
    if (!target) {
      document.querySelectorAll(".pondpilot-widget").forEach((element) => {
        const widget = widgetInstances.get(element);
        if (widget) widget.destroy();
        element.remove();
      });
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }
      return;
    }

    const elements = collectElements(target);
    elements.forEach((element) => {
      const widgetElement = element.classList.contains("pondpilot-widget")
        ? element
        : element.querySelector(".pondpilot-widget");
      if (!widgetElement) return;
      const widget = widgetInstances.get(widgetElement);
      if (widget) {
        widget.destroy();
        widgetElement.remove();
      }
    });
  }

  function updateConfig(updates = {}) {
    if (!updates || typeof updates !== "object") return { ...config };

    const next = { ...config };

    if (updates.selector) next.selector = String(updates.selector);
    if (updates.baseUrl) next.baseUrl = sanitizeBaseUrl(updates.baseUrl);
    if (updates.theme) next.theme = String(updates.theme);

    if (updates.autoInit !== undefined) next.autoInit = Boolean(updates.autoInit);
    if (updates.editable !== undefined) next.editable = Boolean(updates.editable);
    if (updates.duckdbVersion) next.duckdbVersion = String(updates.duckdbVersion);
    if (updates.duckdbCDN) next.duckdbCDN = String(updates.duckdbCDN);
    if (updates.duckdbIntegrity !== undefined) next.duckdbIntegrity = updates.duckdbIntegrity;
    if (updates.duckdbInstance !== undefined) next.duckdbInstance = updates.duckdbInstance;
    if (updates.duckdbModule !== undefined) next.duckdbModule = updates.duckdbModule;
    if (updates.onDuckDBReady !== undefined) next.onDuckDBReady = updates.onDuckDBReady;

    if (updates.showPoweredBy !== undefined) next.showPoweredBy = Boolean(updates.showPoweredBy);
    if (updates.poweredByLabel) next.poweredByLabel = String(updates.poweredByLabel);
    if (updates.customThemes) {
      next.customThemes = mergeCustomThemes(config.customThemes, updates.customThemes);
    }

    if (updates.initQueries !== undefined) {
      const normalized = normalizeInitQueries(updates.initQueries);
      if (duckDBInitQueriesExecuted || duckDBInitQueriesPromise) {
        console.warn("DuckDB init queries already executed; update will apply on next page load.");
      } else {
        next.initQueries = normalized;
        duckDBInitQueriesSignature = JSON.stringify(normalized);
      }
    }

    if (updates.resetQueries !== undefined) {
      next.resetQueries = normalizeInitQueries(updates.resetQueries);
    }

    Object.assign(config, next);
    return { ...config };
  }

  function getConfig() {
    return { ...config, customThemes: { ...config.customThemes } };
  }

  function registerTheme(name, definition) {
    if (!name) throw new Error("registerTheme requires a theme name");
    config.customThemes[name] = definition;
    return { ...config.customThemes[name] };
  }

  function create(element, overrides) {
    const widgets = init(element, overrides);
    return widgets.length ? widgets[0] : null;
  }

  const internals = {
    normalizeInitQueries,
    resolvePath,
    resolvePathsInSQL,
    applyTheme,
    getThemeConfig,
    mergeCustomThemes,
    resolveThemeName,
    resolveThemeMode,
    ensureThemeFonts,
    normalizeDuckDBInstance,
  };

  const api = {
    version: VERSION,
    init,
    destroy,
    create,
    config: updateConfig,
    getConfig,
    registerTheme,
    Widget: PondPilotWidget,
    __internals: internals,
  };

  if (typeof window !== "undefined") {
    window[GLOBAL_NAMESPACE] = api;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof document !== "undefined") {
    const autoInit = () => {
      if (config.autoInit !== false) {
        init();
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoInit, { once: true });
    } else {
      autoInit();
    }
  }
})();
