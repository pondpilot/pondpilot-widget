# PondPilot Widget API Reference

## Quick Start

```html
<!-- Add widget class to any <pre> tag -->
<pre class="pondpilot-snippet">
SELECT * FROM users;
</pre>

<!-- Load the widget -->
<script src="https://cdn.jsdelivr.net/gh/pondpilot/pondpilot-widget@latest/dist/pondpilot-widget.min.js"></script>
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
- `showPoweredBy` (Boolean): Show/hide PondPilot branding (default: true)
- `baseUrl` (String): Override the base URL for this widget
- `selector` (String): CSS selector for auto-initialization

### `PondPilot.config`

Global configuration object:

```javascript
PondPilot.config = {
  selector: 'pre.pondpilot-snippet',  // CSS selector
  baseUrl: 'http://localhost:5173',    // Base URL
  theme: 'light',                      // Default theme
  autoInit: true                       // Auto-initialize on load
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
