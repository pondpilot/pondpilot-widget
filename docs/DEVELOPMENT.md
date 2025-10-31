# PondPilot Widget Development Guide

## Project Structure

```
pondpilot-widget/
├── src/                    # Widget source (single-file build)
│   └── pondpilot-widget.js # Main widget source
├── dist/                   # Build output (gitignored)
│   ├── pondpilot-widget.js      # Unminified build
│   └── pondpilot-widget.min.js  # Minified build
├── examples/               # Example HTML files
│   ├── index.html
│   ├── basic.html
│   └── customization.html
├── tests/                  # Vitest unit tests + helpers
├── docs/                   # Documentation
│   ├── API.md
│   └── DEVELOPMENT.md
├── build.js                # Build script (Terser)
├── package.json
├── README.md
└── LICENSE
```

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/pondpilot/pondpilot-widget.git
   cd pondpilot-widget
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Format code (Prettier)**
   ```bash
   npm run format
   # or to check without writing:
   npm run format:check
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   python3 -m http.server 8000
   ```

5. **Open examples**
   - http://localhost:8000/examples/basic.html
   - http://localhost:8000/examples/customization.html

## Building

Build both minified and unminified versions:

```bash
npm run build
```

This creates:
- `dist/pondpilot-widget.js` - Full version with comments
- `dist/pondpilot-widget.min.js` - Minified production version

## Code Overview

### Main Components

1. **Widget Class** (`PondPilotWidget`)
   - Handles mounting/teardown and DOM lifecycles
   - Applies themes (built-in + custom)
   - Manages editor state and highlighting
   - Controls DuckDB execution and result rendering

2. **DuckDB Integration**
   - Dynamic loading of DuckDB WASM
   - Optional external instance injection
   - Connection management
   - Init queries executed once per page

3. **Path Resolution**
   - Normalises relative/absolute URLs
   - Supports parquet/csv/json/arrow
   - Integrates with DuckDB `registerFileURL`

4. **UI Components**
   - Button tray (Run / Reset)
   - Editable SQL editor with highlighting
   - Results table + metadata
   - “Powered by” footer and duck watermark

### Key Methods

- `init()` - Initialize widget DOM
- `initDuckDB()` - Load and setup DuckDB
- `run()` - Execute SQL query
- `reset()` - Reset to original SQL
- `displayResults()` - Render query results
- `processSQLFileReferences()` - Resolve/register external files

## Testing

### Custom Events (for integration tests)

- `pondpilot:results` — emitted after a widget writes results; payload contains `{ data, elapsed, widget }`.


1. **Unit Tests (Vitest)**
   ```bash
   npm test              # run once
   npm run test:watch    # watch mode
   npm run test:coverage # coverage report
   ```

2. **Manual Testing**
   - Test examples across browsers
   - Toggle light/dark/custom themes
   - Verify read-only widgets
   - Test error messaging and init queries
- Verify Ctrl/Cmd+Enter runs the current query

3. **Browser Compatibility**
   - Chrome/Edge (requires CORS headers for SharedArrayBuffer)
   - Firefox
   - Safari (best compatibility)

## Publishing

1. **Update version**
   ```bash
   npm version patch/minor/major
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Test CDN loading**
   ```html
   <script src="https://unpkg.com/pondpilot-widget@latest"></script>
   ```

4. **Publish to NPM**
   ```bash
   npm publish
   ```

## Customization Guide

### Adding New Options

1. Extend `DEFAULT_CONFIG` in `src/pondpilot-widget.js`.
2. Thread the option through constructor merge logic.
3. Apply behaviour inside `PondPilotWidget` or helper modules.
4. Update docs/tests accordingly.

### Styling Changes

All styles live in the `styles` template literal. We rely on CSS custom properties, so prefer updating tokens over hard-coded colours. Ensure both light/dark defaults remain legible.

### Themes

- Built-in themes are stored in `BUILTIN_THEMES`.
- Validation keys are defined in `REQUIRED_THEME_KEYS`.
- Use `registerTheme` in docs/examples when adding showcase palettes.

### DuckDB Version

The DuckDB version is configured in the widget:
```javascript
duckdbVersion: "1.31.1-dev1.0"

// To update, change the version in config and rebuild
```

## Troubleshooting

### SharedArrayBuffer Issues
DuckDB WASM requires SharedArrayBuffer, which needs specific headers in Chrome/Edge:

- Use Safari for development (no headers required)
- Or serve with proper COOP/COEP headers:
  ```
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
  ```
- Firefox works without headers in local development
- Production servers must include these headers for Chrome/Edge

### Build Errors
- Ensure Node.js >= 14
- Run `npm install` to get terser
- Check file paths in build.js

### Widget Not Initializing
- Check browser console for errors
- Verify DuckDB CDN is accessible
- Ensure proper HTML structure and selector configuration
- Confirm `autoInit` is enabled or call `PondPilot.init()` manually
