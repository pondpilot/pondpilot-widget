# PondPilot Widget

[![npm version](https://img.shields.io/npm/v/pondpilot-widget.svg)](https://www.npmjs.com/package/pondpilot-widget)
[![npm downloads](https://img.shields.io/npm/dm/pondpilot-widget.svg)](https://www.npmjs.com/package/pondpilot-widget)
[![CDN hits](https://img.shields.io/jsdelivr/npm/hm/pondpilot-widget)](https://www.jsdelivr.com/package/npm/pondpilot-widget)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Transform static SQL code blocks into interactive snippets powered by DuckDB WASM.

🎮 **[Try it live](https://widget.pondpilot.io)** - Interactive examples and demos

## Features

- 🦆 **DuckDB in the Browser** - Full SQL analytics engine running locally
- ✨ **Zero Backend** - Everything runs client-side in WebAssembly
- 🎨 **Syntax Highlighting** - Beautiful SQL code formatting with cursor preservation
- ⚡ **Instant Results** - Execute queries with one click or Ctrl/Cmd+Enter
- 🔧 **Easy Integration** - Works with any static site or documentation
- 🧩 **Configurable** - Tweak selectors, auto-init, editable mode, and UI affordances
- 🗂️ **Init Queries** - Install DuckDB extensions or run setup SQL once per page
- ♻️ **Reset Queries** - Optionally run cleanup SQL when the editor resets
- 🎨 **Custom Themes** - Extend light/dark defaults or register fully custom palettes
- ♿ **Accessible** - Full ARIA support and keyboard navigation
- 🎯 **Lightweight** - Only ~22KB minified, loads DuckDB on-demand
- 🌙 **Dark Mode** - Automatic theme detection or manual control
- 🔒 **Secure** - No data leaves the browser, CSP-compatible
- 📁 **Relative Paths** - Automatic resolution of relative parquet file paths

## Installation

### CDN (Recommended)
The easiest way to get started is via CDN:

```html
<!-- Latest version -->
<script src="https://unpkg.com/pondpilot-widget"></script>

<!-- Specific version (recommended for production) -->
<script src="https://unpkg.com/pondpilot-widget@1.4.0"></script>

<!-- Alternative CDN -->
<script src="https://cdn.jsdelivr.net/npm/pondpilot-widget"></script>
```

### Package Manager
For projects using a bundler:

#### NPM
```bash
npm install pondpilot-widget
```

#### Yarn
```bash
yarn add pondpilot-widget
```

## Quick Start

### 1. Add the Script Tag

```html
<script src="https://unpkg.com/pondpilot-widget"></script>
```

### 2. Mark Your SQL Code Blocks

```html
<pre class="pondpilot-snippet">
SELECT
  'Hello World' as greeting,
  42 as answer,
  CURRENT_DATE as today;
</pre>
```

### 3. That's It!

The widget automatically transforms your static code blocks into interactive SQL editors.

### Alternative: Using a Bundler

If you're using a bundler like Webpack, Vite, or Parcel:

```javascript
import "pondpilot-widget";
```

## Usage Examples

### Basic Configuration

```javascript
// Configure before initialization
window.PondPilot.config.theme = 'dark';
window.PondPilot.config.showPoweredBy = false;

// Or initialize with options
new PondPilot.Widget(element, {
  theme: 'dark',
  editable: false,
  showPoweredBy: false
});
```

### Framework Integration

#### React
```jsx
import { useEffect, useRef } from "react";
import "pondpilot-widget";

function SQLEditor({ sql, ...options }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      const widget = new window.PondPilot.Widget(ref.current, options);
      return () => widget.destroy();
    }
  }, []);

  return (
    <pre ref={ref} className="pondpilot-snippet">
      {sql}
    </pre>
  );
}
```

## Advanced Configuration

The runtime exposes a global API with ergonomic helpers:

```javascript
const { config, init, create, destroy, registerTheme, getConfig } = window.PondPilot;

// Merge default configuration
config({
  selector: "pre.sql-demo",
  baseUrl: "https://cdn.example.com/datasets",
  autoInit: false,
  initQueries: ["INSTALL httpfs", "LOAD httpfs"],
  resetQueries: ["DROP TABLE IF EXISTS scratch_table;"],
});

// Register a custom theme and apply it via data-theme or options.theme
registerTheme("sunset", {
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
    primaryText: "#ffffff",
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

// Manually mount widgets when needed
document.querySelectorAll("pre.sql-demo").forEach((node) => {
  window.PondPilot.create(node, { theme: "sunset" });
});
```

### Data attributes

Per-snippet overrides can be expressed declaratively:

```html
<pre
  class="pondpilot-snippet"
  data-theme="sunset"
  data-base-url="https://cdn.example.com/data"
  data-init-queries='["LOAD httpfs"]'
>
  <code>SELECT * FROM 'sales.parquet';</code>
</pre>
```

Supported attributes include:

- `data-theme`
- `data-base-url`
- `data-editable`
- `data-show-powered-by`
- `data-init-queries` (semicolon or JSON array)

## API Summary

- `PondPilot.init(target?, options?)` – initialize matching elements (defaults to `config.selector`)
- `PondPilot.create(element, options?)` – mount a single instance on demand
- `PondPilot.destroy(target?)` – remove widgets (defaults to all)
- `PondPilot.config(partial)` – merge configuration
- `PondPilot.getConfig()` – inspect current configuration
- `PondPilot.registerTheme(name, definition)` – extend theming system
- `PondPilot.Widget` – constructor for manual control (`new PondPilot.Widget(element, options)`)

#### Vue
```vue
<template>
  <pre ref="editor" class="pondpilot-snippet">{{ sql }}</pre>
</template>

<script>
import 'pondpilot-widget';

export default {
  props: ['sql', 'options'],
  mounted() {
    this.widget = new window.PondPilot.Widget(this.$refs.editor, this.options);
  },
  beforeUnmount() {
    this.widget?.destroy();
  }
}
</script>
```

### Markdown/Documentation Sites

#### Docusaurus
```javascript
// In docusaurus.config.js
module.exports = {
  scripts: [
    'https://unpkg.com/pondpilot-widget'
  ],
  // ...
};
```

#### VitePress
```javascript
// In .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme';
import 'pondpilot-widget';

export default DefaultTheme;
```

## Local Examples (in this repo)

You can run a small examples site from the examples/ folder:

1) Serve the repository root (so examples/ is web‑served):

```bash
python3 -m http.server 8080
# then open http://localhost:8080/examples/index.html
```

2) Local .duckdb database demo (optional):

```bash
# create a tiny demo DB at examples/data/blog.duckdb
uv run examples/create-blog-db.py   # or: pip install duckdb pandas && python3 examples/create-blog-db.py

# open the demo page
open http://localhost:8080/examples/local-duckdb.html
```

3) Relative Parquet path handling demo (optional):

```bash
cd examples/relative-paths
python3 create-test-data.py  # creates analytics.parquet in this directory
cd ../..
open http://localhost:8080/examples/relative-paths/test-relative-paths.html
```

4) A5 Geospatial Extension demo with interactive map:

```bash
# No setup required - just open the demo
open http://localhost:8080/examples/a5-geospatial-demo.html
```

Notes:
- The example pages in this repo load the widget from ../src/ for local development. You can switch them to use the CDN by replacing the script tag with the CDN snippet from Installation.
- The local .duckdb example shows how to provide an external DuckDB WASM instance to the widget and open a DB file served over HTTP.
- The relative‑paths example demonstrates how the widget auto‑resolves relative parquet file paths in queries.
- The A5 demo shows how to use DuckDB community extensions for geospatial analysis with interactive Leaflet map visualization.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `selector` | string | `"pre.pondpilot-snippet, .pondpilot-snippet pre"` | CSS selector for SQL blocks |
| `theme` | string | `"light"` | Theme: "light" or "dark" |
| `editable` | boolean | `true` | Allow editing SQL code |
| `showPoweredBy` | boolean | `true` | Show "Powered by PondPilot" branding |
| `baseUrl` | string | `"http://localhost:5173"` | PondPilot instance URL |
| `autoInit` | boolean | `true` | Auto-initialize on DOM ready |

## API Reference

### Global Object
```javascript
window.PondPilot = {
  init(),           // Initialize all widgets
  destroy(),        // Clean up all widgets
  config: {},       // Global configuration
  Widget: class {}  // Widget constructor
};
```

### Widget Instance
```javascript
const widget = new PondPilot.Widget(element, options);

// Methods
await widget.run();      // Execute SQL query
widget.reset();          // Reset to original code
await widget.cleanup();  // Clean up resources
widget.destroy();        // Destroy widget
```

## Security Considerations

1. **Content Security Policy (CSP)**
   ```
   Content-Security-Policy:
     script-src 'self' https://unpkg.com https://cdn.jsdelivr.net;
     worker-src 'self' blob: https://cdn.jsdelivr.net;
     connect-src 'self' https://cdn.jsdelivr.net;
   ```

2. **Subresource Integrity (SRI)**
   ```html
   <script
    src="https://unpkg.com/pondpilot-widget@1.4.0"
     integrity="sha384-[hash]"
     crossorigin="anonymous">
   </script>
   ```

## Browser Support

- Chrome/Edge 88+
- Firefox 89+
- Safari 15+

Requires:
- WebAssembly
- Web Workers
- ES2018+

## Working with Parquet Files

The widget supports loading parquet files from various sources:

### Direct HTTP URLs
```sql
SELECT * FROM 'https://example.com/data.parquet' LIMIT 10;
```

### Relative Paths (New in v1.1.0)
The widget automatically resolves relative paths to absolute URLs:

```sql
-- All of these formats are supported:
SELECT * FROM 'data.parquet';
SELECT * FROM './data.parquet';
SELECT * FROM '/data.parquet';
```

When using relative paths:
- Files must be accessible via HTTP from the same server
- The widget resolves paths relative to the current page URL
- For local development, ensure your files are served by a web server

## Performance Tips

1. **Lazy Loading**: DuckDB is only loaded when first query runs
2. **Shared Instance**: Multiple widgets share the same DuckDB instance
3. **Resource Cleanup**: Widgets automatically clean up when removed from DOM
4. **File Caching**: Registered parquet files are cached to avoid duplicate downloads

## Changelog

See [CHANGELOG.md](https://github.com/pondpilot/pondpilot-widget/blob/main/CHANGELOG.md) for release history.

## License

MIT © PondPilot

## Contributing

Contributions welcome! Please read our [contributing guide](https://github.com/pondpilot/pondpilot-widget/blob/main/CONTRIBUTING.md).

### Local development

```bash
npm install       # install dependencies
npm run format    # apply Prettier formatting
npm test          # run the Vitest suite
```

Prefer `just`? We provide a lightweight `justfile` with the same commands (`just format`, `just test`, etc.).

## Support

- 🐛 [Issue Tracker](https://github.com/pondpilot/pondpilot-widget/issues)
