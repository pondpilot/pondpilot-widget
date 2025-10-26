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
window.PONDPILOT_BASE_URL = 'https://app.pondpilot.io';
</script>
<script src="path/to/pondpilot-widget.js"></script>
```

## JavaScript API

### `PondPilot.init()`

Manually initialize all widgets on the page:

```javascript
PondPilot.init();
```

### `PondPilot.destroy()`

Clean up all widgets and stop observing DOM changes:

```javascript
PondPilot.destroy();
```

### `PondPilot.Widget`

The widget constructor for programmatic initialization:

```javascript
const widget = new PondPilot.Widget(element, options);
```

#### Parameters:
- `element` (HTMLElement): The DOM element to transform into a widget
- `options` (Object): Configuration options

#### Options:
- `theme` (String): 'light' or 'dark' (default: 'light')
- `editable` (Boolean): Whether the SQL can be edited (default: true)
- `showPoweredBy` (Boolean): Show/hide PondPilot branding and duck logo (default: true)
- `baseUrl` (String): Override the base URL for this widget
- `selector` (String): CSS selector for auto-initialization
- `duckdbVersion` (String): DuckDB WASM version to use
- `duckdbCDN` (String): CDN URL for DuckDB WASM
- `duckdbInstance` (Object/Promise): External DuckDB instance or Promise that resolves to instance
- `duckdbModule` (Object): DuckDB module reference (optional with external instance)
- `onDuckDBReady` (Function): Callback when internal DuckDB instance is ready `(db, module) => {}`

### `PondPilot.config`

Global configuration object:

```javascript
PondPilot.config = {
  selector: 'pre.pondpilot-snippet, .pondpilot-snippet pre',  // CSS selector
  baseUrl: 'http://localhost:5173',    // Base URL
  theme: 'light',                      // Default theme
  autoInit: true,                      // Auto-initialize on load
  duckdbVersion: '1.31.1-dev1.0',     // DuckDB WASM version
  duckdbCDN: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm'  // CDN URL
};
```

## Widget Instance Methods

### `widget.run()`

Execute the current SQL query:

```javascript
widget.run();
```

### `widget.reset()`

Reset the SQL to its original state:

```javascript
widget.reset();
```

### `widget.destroy()`

Clean up the widget and release resources:

```javascript
widget.destroy();
```

### `widget.cleanup()`

Async cleanup of DuckDB connections:

```javascript
await widget.cleanup();
```

## CSS Classes

### Auto-initialization Classes

- `.pondpilot-snippet` - Basic widget
- `.pondpilot-snippet-dark` - Dark theme widget
- `.pondpilot-snippet-readonly` - Read-only widget

### Widget Structure Classes

- `.pondpilot-widget` - Main container
- `.pondpilot-editor` - SQL editor area
- `.pondpilot-run-button` - Run button
- `.pondpilot-output` - Results area
- `.pondpilot-output-content` - Results content
- `.pondpilot-results-footer` - Footer with info and reset
- `.pondpilot-reset-button` - Reset button
- `.pondpilot-powered` - Branding link
- `.pondpilot-duck` - Duck logo watermark
- `.pondpilot-error` - Error messages
- `.pondpilot-loading` - Loading state

## Events

Currently, the widget doesn't emit custom events, but you can listen to standard DOM events on the widget elements.

## Examples

### Basic Usage

```html
<pre class="pondpilot-snippet">
SELECT 'Hello World' as greeting;
</pre>
```

### Custom Configuration

```javascript
// Initialize with custom options
new PondPilot.Widget(element, {
  theme: 'dark',
  editable: false,
  showPoweredBy: false
});
```

### Multiple Widgets

```javascript
// Initialize all matching elements
document.querySelectorAll('.my-sql-blocks').forEach(el => {
  new PondPilot.Widget(el, { theme: 'dark' });
});
```

### Delayed Initialization

```javascript
// Disable auto-init
PondPilot.config.autoInit = false;

// Initialize later
setTimeout(() => {
  PondPilot.init();
}, 1000);
```

### Using External DuckDB Instance

```javascript
// Example: Pass your DuckDB instance - widget will wait for it to be ready
// (Replace 'yourInitFunction' with your actual DuckDB initialization)
const myDB = await yourInitFunction();

new PondPilot.Widget(element, {
  duckdbInstance: myDB,
  duckdbModule: duckdbModule // Optional
});

// Or pass a promise that resolves to the instance
const dbPromise = yourInitFunction(); // Your async init function

new PondPilot.Widget(element, {
  duckdbInstance: dbPromise // Widget will await this
});

// Real example with your Zustand store pattern:
const { db } = useDuckDBStore.getState();
new PondPilot.Widget(element, {
  duckdbInstance: db // Can be null, instance, or promise
});
```

### Accessing Internal Instance

```javascript
// Get notified when internal DuckDB is ready
new PondPilot.Widget(element, {
  onDuckDBReady: (db, module) => {
    console.log('DuckDB instance ready:', db);
    // Use the instance for other purposes
    window.sharedDB = db;
  }
});
```
