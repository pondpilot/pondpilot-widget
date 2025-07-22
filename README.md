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
<script src="https://unpkg.com/pondpilot-widget@1.1.0"></script>

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
// Import in your main JS file
import 'pondpilot-widget';
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
import { useEffect, useRef } from 'react';
import 'pondpilot-widget';

function SQLEditor({ sql, ...options }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      const widget = new window.PondPilot.Widget(ref.current, options);
      return () => widget.destroy();
    }
  }, []);

  return <pre ref={ref} className="pondpilot-snippet">{sql}</pre>;
}
```

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
     src="https://unpkg.com/pondpilot-widget@1.1.0"
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

## Support

- 🐛 [Issue Tracker](https://github.com/pondpilot/pondpilot-widget/issues)
