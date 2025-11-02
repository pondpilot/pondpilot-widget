# PondPilot Widget API Reference

## Quick Start

```html
<!-- Add widget class to any <pre> tag -->
<pre class="pondpilot-snippet">
SELECT * FROM users;
</pre>

<!-- Load the widget -->
<script src="https://unpkg.com/pondpilot-widget@latest"></script>
```

## Global Configuration

### `window.PONDPILOT_BASE_URL`

Set the base URL for your PondPilot instance before loading the widget:

```html
<script>
  window.PONDPILOT_BASE_URL = "https://app.pondpilot.io";
</script>
<script src="path/to/pondpilot-widget.js"></script>
```

### `window.PONDPILOT_CONFIG`

Provide multiple defaults in a single object before loading the script:

```html
<script>
  window.PONDPILOT_CONFIG = {
    autoInit: false,
    initQueries: ["INSTALL httpfs;", "LOAD httpfs;"],
    resetQueries: ["DROP TABLE IF EXISTS scratch_table;"]
  };
</script>
<script src="path/to/pondpilot-widget.js"></script>
```

### `window.PONDPILOT_INIT_QUERIES`

Legacy helper for setting init queries via a global:

```html
<script>
  window.PONDPILOT_INIT_QUERIES = ["INSTALL spatial;", "LOAD spatial;"];
</script>
```

### `window.PONDPILOT_RESET_QUERIES`

Run cleanup SQL whenever a widget resets:

```html
<script>
  window.PONDPILOT_RESET_QUERIES = ["DROP TABLE IF EXISTS scratch_table;"];
</script>
```

## JavaScript API

All helpers live under `window.PondPilot`.

### `PondPilot.config(partial)`

Merge configuration values. Returns the updated snapshot.

```javascript
PondPilot.config({
  selector: "pre.sql-demo",
  baseUrl: "https://cdn.example.com/data",
  autoInit: false,
  initQueries: ["INSTALL httpfs", "LOAD httpfs"],
  resetQueries: ["DROP TABLE IF EXISTS scratch_table;"],
});
```

### `PondPilot.getConfig()`

Inspect the current configuration.

```javascript
console.log(PondPilot.getConfig());
```

### `PondPilot.init(target?, options?)`

Initialize widgets. Accepts:

- nothing (use `config.selector`)
- CSS selector string
- single `HTMLElement`
- `NodeList`/array of elements

```javascript
PondPilot.init(); // default selector
PondPilot.init("pre.sql-demo", { theme: "dark" });
```

### `PondPilot.create(element, options?)`

Transform one element immediately. Returns the widget instance (or `null`).

```javascript
const pre = document.querySelector(".pondpilot-snippet");
const widget = PondPilot.create(pre, { editable: false });
```

### `PondPilot.destroy(target?)`

Remove widgets and release resources. Pass a selector/element to limit scope.

```javascript
PondPilot.destroy(); // everything
PondPilot.destroy(".sidebar .pondpilot-widget");
```

### `PondPilot.registerTheme(name, definition)`

Register a reusable theme. Themes can extend `"light"` or `"dark"` and override token values.

```javascript
PondPilot.registerTheme("forest", {
  extends: "dark",
  config: {
    bgColor: "#102418",
    textColor: "#dcfce7",
    borderColor: "#14532d",
    editorBg: "#06270f",
    editorText: "#f0fdf4",
    editorFocusBg: "#0d4020",
    controlsBg: "rgba(12, 48, 25, 0.72)",
    primaryBg: "#22c55e",
    primaryText: "#052e16",
    primaryHover: "#16a34a",
    secondaryBg: "rgba(34, 197, 94, 0.2)",
    secondaryText: "#bbf7d0",
    secondaryHover: "rgba(34, 197, 94, 0.32)",
    mutedText: "#86efac",
    errorText: "#f87171",
    errorBg: "rgba(248, 113, 113, 0.12)",
    errorBorder: "rgba(248, 113, 113, 0.32)",
    tableHeaderBg: "rgba(34, 197, 94, 0.16)",
    tableHeaderText: "#bbf7d0",
    tableHover: "rgba(34, 197, 94, 0.12)",
    syntaxKeyword: "#4ade80",
    syntaxString: "#fbbf24",
    syntaxNumber: "#60a5fa",
    syntaxComment: "#86efac",
    syntaxSpecial: "#f97316",
    syntaxIdentifier: "#facc15",
    fontFamily: "Inter, system-ui, sans-serif",
    editorFontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
    editorFontSize: "13px",
    buttonFontSize: "13px",
    metadataFontSize: "12px",
  },
});
```

### `PondPilot.Widget`

Constructor for granular control:

```javascript
const widget = new PondPilot.Widget(element, {
  theme: "dark",
});

widget.run();
```

## Configuration Options

| Option             | Type                                      | Default                                            | Description                                                                 |
| ------------------ | ----------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| `selector`         | `string`                                  | `"pre.pondpilot-snippet, .pondpilot-snippet pre"`  | Elements auto-initialized when `autoInit` runs                              |
| `baseUrl`          | `string`                                  | `"https://app.pondpilot.io"`                       | Base URL for resolving relative SQL file paths                              |
| `theme`            | `"light" \| "dark" \| "auto" \| string`   | `"light"`                                          | Default theme (custom names supported via `registerTheme`)                  |
| `autoInit`         | `boolean`                                 | `true`                                             | Automatically call `init()` on DOM ready                                    |
| `editable`         | `boolean`                                 | `true`                                             | Allow users to edit SQL inline                                              |
| `duckdbVersion`    | `string`                                  | `"1.31.1-dev1.0"`                                  | Version suffix passed to the CDN import                                     |
| `duckdbCDN`        | `string`                                  | `"https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm"` | CDN root for DuckDB WASM                                                   |
| `duckdbInstance`   | `AsyncDuckDB \| Promise`                  | `undefined`                                        | Provide your own DuckDB instance                                            |
| `duckdbModule`     | `object`                                  | `undefined`                                        | Provide an accompanying module when supplying a custom instance             |
| `onDuckDBReady`    | `function`                                | `undefined`                                        | Callback invoked after the internal DuckDB has been instantiated           |
| `initQueries`      | `string[]`                                | `[]`                                               | SQL statements executed once after DuckDB connection is available          |
| `resetQueries`     | `string[]`                                | `[]`                                               | SQL statements executed every time the reset button is pressed             |
| `showPoweredBy`    | `boolean`                                 | `true`                                             | Toggle the branding footer                                                  |
| `poweredByLabel`   | `string`                                  | `"PondPilot"`                                      | Link label in the footer                                                    |
| `customThemes`     | `Record<string, CustomTheme>`             | `{}`                                               | Theme registry merged via `registerTheme`                                   |

### CustomTheme shape

```ts
type CustomTheme = {
  extends?: "light" | "dark";
  config: Partial<ThemeTokens>;
};
```

`ThemeTokens` corresponds to the keys in the configuration table (backgrounds, syntax colors, fonts, etc.). When `extends` is omitted the theme must supply every required token.

## Data Attributes

Every widget can override options declaratively:

| Attribute                 | Example value                                        | Effect                                  |
| ------------------------- | ---------------------------------------------------- | --------------------------------------- |
| `data-theme`              | `"dark"` / `"auto"` / `"forest"`                     | Override theme                          |
| `data-base-url`           | `"https://cdn.example.com/data"`                     | Override `baseUrl`                      |
| `data-editable`           | `"false"`                                            | Disable editing                         |
| `data-show-powered-by`    | `"false"`                                            | Hide footer                             |
| `data-init-queries`       | `"LOAD httpfs; SET s3_region='us-east-1'"` or JSON   | Per-widget init queries                 |
| `data-reset-queries`      | `"DROP TABLE IF EXISTS scratch;"` or JSON            | Per-widget reset queries                |

Boolean values accept `true/false`, `1/0`, or `yes/no`. Init/reset queries accept semicolon-delimited strings or JSON arrays.

## Widget Instance Methods

| Method            | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `widget.run()`    | Executes the current SQL query                         |
| `widget.reset()`  | Restores the original SQL block and runs reset queries |
| `widget.destroy()`| Destroys the widget and releases resources             |
| `widget.cleanup()`| Async helper used internally to close DuckDB handles   |

## Keyboard Shortcuts

- `Ctrl`+`Enter` (Windows/Linux) or `Cmd`+`Enter` (macOS): Run the current query in the focused widget.

# Custom Events

Widgets emit a few custom DOM events you can use to hook into query lifecycles.

### `pondpilot:results`

- **Detail payload:** `{ data, elapsed, widget }`
- **When:** Fired after results render successfully
- **Bubbles:** yes (listen on container or document)

```javascript
document.addEventListener("pondpilot:results", (event) => {
  const { data, elapsed } = event.detail;
  console.log(`Got ${data.length} rows in ${elapsed}ms`);
});
```

## DOM Structure & CSS Hooks

- `.pondpilot-widget` – root element
- `.pondpilot-editor` – editable SQL block (`<pre>` inside)
- `.pondpilot-button-container` – wraps reset/run buttons
- `.pondpilot-run-button` – primary run button
- `.pondpilot-reset-button` – reset to original SQL
- `.pondpilot-output` / `.pondpilot-output-content` – results container
- `.pondpilot-progress` – loading state wrapper
- `.pondpilot-error` – error state
- `.pondpilot-powered` – branding footer
- `.pondpilot-duck` – watermark link

Syntax highlighting classes:

- `.sql-hl-keyword`
- `.sql-hl-string`
- `.sql-hl-number`
- `.sql-hl-comment`
- `.sql-hl-special`
- `.sql-hl-identifier`

## Examples

### Manual Mount

```javascript
const elements = document.querySelectorAll("pre.sql-example");
elements.forEach((el) => {
  PondPilot.create(el, { theme: "auto" });
});
```

### Registering a Theme Once

```javascript
PondPilot.registerTheme("brand", {
  extends: "light",
  config: {
    bgColor: "#f1f5f9",
    textColor: "#0f172a",
    borderColor: "#38bdf8",
    editorBg: "#ffffff",
    editorText: "#0f172a",
    editorFocusBg: "#e0f2fe",
    controlsBg: "rgba(56, 189, 248, 0.16)",
    primaryBg: "#0ea5e9",
    primaryText: "#f8fafc",
    primaryHover: "#0284c7",
    secondaryBg: "rgba(14, 165, 233, 0.16)",
    secondaryText: "#0f172a",
    secondaryHover: "rgba(14, 165, 233, 0.28)",
    mutedText: "#475569",
    errorText: "#dc2626",
    errorBg: "rgba(220, 38, 38, 0.08)",
    errorBorder: "rgba(220, 38, 38, 0.2)",
    tableHeaderBg: "rgba(56, 189, 248, 0.16)",
    tableHeaderText: "#0f172a",
    tableHover: "rgba(56, 189, 248, 0.12)",
    syntaxKeyword: "#0284c7",
    syntaxString: "#0f766e",
    syntaxNumber: "#4338ca",
    syntaxComment: "#64748b",
    syntaxSpecial: "#dc2626",
    syntaxIdentifier: "#d97706",
    fontFamily: "Inter, system-ui, sans-serif",
    editorFontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
    editorFontSize: "13px",
    buttonFontSize: "13px",
    metadataFontSize: "12px",
  },
});
```

```html
<pre class="pondpilot-snippet" data-theme="brand">
SELECT * FROM 'sales.parquet';
</pre>
```
