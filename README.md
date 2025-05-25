# PondPilot Widget

Transform static SQL code blocks into interactive snippets powered by DuckDB WASM

## Features

- 🚀 **Zero Backend Required** - Runs entirely in the browser using DuckDB WASM
- ✏️ **Editable Code** - Users can modify and run SQL queries
- 🎨 **Syntax Highlighting** - Beautiful SQL syntax highlighting
- 📊 **Rich Output** - Display query results in formatted tables
- 🔗 **PondPilot Integration** - "Open in PondPilot" button for advanced features
- 🌙 **Dark Mode Support** - Automatic theme detection
- 📱 **Responsive Design** - Works on all screen sizes

## Quick Start

### 1. Add the Script

```html
<script src="https://cdn.jsdelivr.net/gh/pondpilot/pondpilot-widget/widget/pondpilot-widget.min.js"></script>
```

### 2. Mark Your Code Blocks

Add the class `pondpilot-snippet` to any `<pre>` tag containing SQL:

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

## Installation Options

### CDN (Recommended)

```html
<!-- Production -->
<script src="https://cdn.jsdelivr.net/gh/pondpilot/pondpilot-widget/widget/pondpilot-widget.min.js"></script>

<!-- Development -->
<script src="https://cdn.jsdelivr.net/gh/pondpilot/pondpilot-widget/widget/pondpilot-widget.js"></script>
```

### NPM

```bash
npm install pondpilot-widget
```

```javascript
import PondPilot from 'pondpilot-widget';

// Initialize widgets
PondPilot.init();
```

### Self-Hosted

Download the widget file and host it on your server:

```html
<script src="/path/to/pondpilot-widget.min.js"></script>
```

## Configuration

### Global Configuration

```html
<script>
// Set before loading the widget
window.PONDPILOT_BASE_URL = 'https://app.pondpilot.io';
</script>
<script src="path/to/pondpilot-widget.js"></script>
```

### Programmatic Configuration

```javascript
// After loading the widget
PondPilot.config.theme = 'dark';
PondPilot.config.editable = false;
PondPilot.config.selector = '.my-sql-blocks';

// Re-initialize with new config
PondPilot.init();
```

### Per-Widget Options

```javascript
// Initialize specific element with custom options
const element = document.querySelector('#my-sql-block');
new PondPilot.Widget(element, {
  theme: 'dark',
  editable: false,
  baseUrl: 'https://custom-instance.com'
});
```

## Styling

The widget comes with default styles that work well with most websites. You can customize the appearance using CSS:

```css
/* Customize widget appearance */
.pondpilot-widget {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.pondpilot-toolbar {
  background: #f0f0f0;
}

.pondpilot-button-primary {
  background: #your-brand-color;
}
```

## Examples

### Basic Query

```html
<pre class="pondpilot-snippet">
SELECT * FROM generate_series(1, 10) AS t(num);
</pre>
```

### Creating Tables

```html
<pre class="pondpilot-snippet">
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10, 2)
);

INSERT INTO products VALUES
    (1, 'Laptop', 999.99),
    (2, 'Mouse', 29.99),
    (3, 'Keyboard', 79.99);

SELECT * FROM products WHERE price < 100;
</pre>
```

### Analytics Query

```html
<pre class="pondpilot-snippet">
WITH monthly_sales AS (
    SELECT
        DATE_TRUNC('month', order_date) as month,
        SUM(amount) as total_sales
    FROM orders
    GROUP BY 1
)
SELECT
    month,
    total_sales,
    LAG(total_sales) OVER (ORDER BY month) as prev_month,
    total_sales - LAG(total_sales) OVER (ORDER BY month) as growth
FROM monthly_sales;
</pre>
```

## API Reference

### `PondPilot.init()`

Initialize all widgets on the page.

```javascript
PondPilot.init();
```

### `PondPilot.Widget`

The widget class for programmatic control.

```javascript
const widget = new PondPilot.Widget(element, options);

// Methods
widget.run();        // Execute the SQL
widget.reset();      // Reset to original code
widget.openInApp();  // Open in PondPilot app
```

### `PondPilot.config`

Global configuration object.

```javascript
PondPilot.config = {
  selector: 'pre.pondpilot-snippet',  // CSS selector for widgets
  baseUrl: 'https://app.pondpilot.com', // PondPilot instance URL
  theme: 'light',                      // 'light' or 'dark'
  autoInit: true,                      // Auto-initialize on load
  editable: true                       // Allow editing by default
};
```

## Browser Support

- Chrome 88+
- Firefox 89+
- Safari 15+
- Edge 88+

The widget requires:
- Web Workers
- WebAssembly
- ES6 support

## Security

The widget runs SQL queries in a sandboxed DuckDB WASM instance. Each widget has its own isolated database context, and no data is sent to any server.

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## Support

- 📖 [Documentation](https://docs.pondpilot.io/widget)
- 🐛 [Issue Tracker](https://github.com/pondpilot/pondpilot-widget/issues)
