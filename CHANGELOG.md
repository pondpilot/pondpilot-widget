# Changelog

## [1.4.0] - 2025-11-03

### Added
- **Theme authoring** – register fully custom themes (incl. font families/sizes) and supply theme configs via `window.PONDPILOT_CONFIG`
- **Init & reset queries** – run setup SQL once per page and optional cleanup SQL whenever the editor resets
- **`pondpilot:results` event** – widgets emit structured row data so maps/visualizations can react without scraping tables
- **Keyboard shortcut (Ctrl/Cmd+Enter)** – execute the current query directly from the editor
- **Tooling** – Prettier configuration, simplified `justfile`, Vitest suite, and React/Vue integration examples

### Changed
- **Editor UX** – improved focus styling, better dark-theme contrast, and progress feedback during init/reset queries
- **Docs & demos** – refreshed API/README/dev docs, new theme gallery, init/reset query guidance, and updated A5 demo that listens for `pondpilot:results`

## [1.3.1] - 2025-10-25

### Added
- **Geospatial analysis example** - New interactive demo showcasing DuckDB community extensions
  - Demonstrates A5 geospatial extension usage for spatial data analysis
  - Interactive Leaflet map visualization integrated with SQL queries
  - Shows how to load and use community extensions in the widget

### Changed
- **Updated DuckDB WASM runtime** to version 1.31.1-dev1.0 for latest engine improvements

## [1.3.0] - 2025-09-17

### Changed
- **Upgraded DuckDB WASM runtime** to version 1.30.0 for the latest engine fixes and features
- **Updated documentation and examples** to reference DuckDB WASM 1.30.0 for consistency across integrations

## [1.2.0] - 2025-09-06

### Added
- **Support for external DuckDB instances** - Users can now bring their own DuckDB instance (#4)
  - Allows integration with existing DuckDB connections in the application
  - Reduces memory footprint when multiple widgets are used
  - Enables sharing of data and configuration across widgets

## [1.1.1] - 2025-08-27

### Fixed
- **Firefox compatibility** - Fixed cross-origin worker loading issue that prevented the widget from working in Firefox
  - Implemented fetch-and-blob approach for loading DuckDB workers from CDN
  - Added proper fallback mechanism for browsers with different CORS policies
  - Workers are now loaded via blob URLs to bypass cross-origin restrictions

### Technical Details
- Modified `createSharedDuckDB()` to fetch worker scripts and create blob URLs
- Added cleanup of blob URLs after worker initialization
- Maintained backward compatibility with Chrome and other browsers
- Improved error messages for worker loading failures

## [1.1.0] - 2025-07-22

### Added
- **Relative path support for parquet files** - Automatically resolves relative paths to absolute URLs (#2)
  - Supports various formats: `'data.parquet'`, `'./data.parquet'`, `'/data.parquet'`
  - Intelligently handles local development and production environments
  - Caches registered files to avoid duplicate downloads
- **Enhanced error messages** for file loading failures with helpful tips

### Technical Details
- Added `processRelativeParquetPaths()` method to detect and register parquet files
- Added `resolveRelativePath()` method for intelligent URL resolution
- Stores DuckDB module reference for accessing `DuckDBDataProtocol` enum
- Tracks registered files to prevent duplicate registrations

## [1.0.2] - 2025-05-27

### Enhanced
- **Improved button layout** - Responsive button container prevents overlapping with long text on small screens
- **Smoother animations** - Added minimum loading duration (200ms) to prevent glitchy flashes on fast queries
- **Updated documentation** - Prioritized CDN integration in README and added link to interactive examples

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
