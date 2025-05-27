# PondPilot Widget Development Guide

## Project Structure

```
pondpilot-widget/
├── src/                    # Source code
│   └── pondpilot-widget.js # Main widget source
├── dist/                   # Build output (gitignored)
│   ├── pondpilot-widget.js # Unminified build
│   └── pondpilot-widget.min.js # Minified build
├── examples/               # Example HTML files
│   ├── index.html         # Full examples
│   ├── basic.html         # Basic usage
│   └── customization.html # Customization examples
├── docs/                   # Documentation
│   ├── API.md             # API reference
│   └── DEVELOPMENT.md     # This file
├── build.js               # Build script
├── package.json           # NPM package config
├── README.md              # Main documentation
└── LICENSE               # MIT license
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

3. **Start development server**
   ```bash
   npm run dev
   # or
   python3 -m http.server 8000
   ```

4. **Open examples**
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
   - Handles widget initialization
   - Manages editor state
   - Controls DuckDB execution
   - Renders results

2. **DuckDB Integration**
   - Dynamic loading of DuckDB WASM
   - Connection management
   - Query execution
   - Result formatting

3. **UI Components**
   - Minimal floating run button
   - Clean SQL editor
   - Results table with footer
   - Subtle duck watermark

### Key Methods

- `init()` - Initialize widget DOM
- `initDuckDB()` - Load and setup DuckDB
- `run()` - Execute SQL query
- `reset()` - Reset to original SQL
- `displayResults()` - Render query results

## Testing

1. **Manual Testing**
   - Test all examples in different browsers
   - Verify dark/light themes
   - Check read-only mode
   - Test error handling

2. **Browser Compatibility**
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

1. Add to default config:
   ```javascript
   const config = {
     // ... existing options
     newOption: 'default-value'
   };
   ```

2. Use in widget:
   ```javascript
   if (this.options.newOption === 'something') {
     // Handle option
   }
   ```

### Styling Changes

All styles are in the `styles` constant. Follow the existing patterns:
- Use CSS variables for consistency
- Support both light and dark themes
- Keep styles minimal and unobtrusive

### DuckDB Version

The DuckDB version is configured in the widget:
```javascript
// In config object
duckdbVersion: "1.29.1-dev68.0"

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
- Ensure proper HTML structure