# Changelog

## [1.0.1] - 2025-05-27

### Fixed
- **Updated default baseUrl** to use https://app.pondpilot.io

## [1.0.0] - 2025-05-27

### Security Fixes
- **Fixed HTML injection vulnerability** in error messages by adding proper HTML escaping
- **Added CSP compatibility** for worker creation with fallback mechanism
- **Added SRI support** configuration for CDN resources
- **Fixed XSS vulnerability** in baseUrl handling - now properly validates URLs and creates links programmatically
- **Fixed CSS template literal** syntax error in styles

### UX Improvements
- **Fixed cursor position loss** during syntax highlighting by preserving and restoring cursor offset
- **Added multi-line comment support** (/* */) to SQL syntax highlighter
- **Added debouncing** for syntax highlighting on large SQL queries (>500 chars)
- **Added version info** (v4.2.0) for inlined sql-highlight library

### Performance Improvements
- **Implemented proper cleanup lifecycle** with destroy method and mutation observer
- **Added resource management** for DuckDB connections and event listeners
- **Optimized highlighting** with smart debouncing based on SQL query size

### Accessibility Improvements
- **Added ARIA attributes** for progress bars (role="progressbar", aria-valuenow, etc.)
- **Added role="alert"** for error messages with aria-live="assertive"
- **Added role="textbox"** and aria-multiline to SQL editor
- **Added aria-labels** to Run and Reset buttons

### Architecture Improvements
- **Extracted magic numbers** into CONSTANTS object
- **Added configuration options** for DuckDB version and CDN URL
- **Improved error handling** with better CSP error messages

### Technical Details

#### Constants Added:
- `DEBOUNCE_DELAY`: 150ms
- `LARGE_SQL_THRESHOLD`: 500 characters
- `MAX_OUTPUT_HEIGHT`: 300px
- Progress step percentages for loading stages

#### New Methods:
- `getCursorOffset()`: Calculates cursor position in text
- `setCursorOffset()`: Restores cursor position after re-highlighting
- `getTextNodes()`: Helper for cursor management
- `destroy()`: Proper cleanup of widget resources
- `escapeHtml()`: Security utility function
- `debounce()`: Performance utility function

#### API Additions:
- `window.PondPilot.destroy()`: Global cleanup method
- WeakMap tracking of widget instances
- MutationObserver for automatic cleanup of removed widgets
