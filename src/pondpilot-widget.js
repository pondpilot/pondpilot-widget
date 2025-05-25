/**
 * PondPilot Widget - Minimal version
 * Transform static SQL code blocks into interactive snippets
 */

(function () {
  'use strict';

  // Widget configuration
  const config = {
    selector: 'pre.pondpilot-snippet, .pondpilot-snippet pre',
    baseUrl: window.PONDPILOT_BASE_URL || 'http://localhost:5173',
    theme: 'light',
    autoInit: true,
  };

  // Minimal widget styles
  const styles = `
    .pondpilot-widget {
      position: relative;
      margin: 1em 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8f9fa;
      border-radius: 6px;
      overflow: hidden;
    }

    .pondpilot-widget.dark {
      background: #1a1b26;
    }

    /* Minimal floating run button */
    .pondpilot-run-button {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 10;
      padding: 4px 12px;
      background: rgba(59, 130, 246, 0.9);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      backdrop-filter: blur(8px);
    }

    .pondpilot-run-button:hover {
      background: rgba(37, 99, 235, 0.95);
      transform: translateY(-1px);
    }

    .pondpilot-run-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Clean editor */
    .pondpilot-editor {
      position: relative;
      background: transparent;
      min-height: 60px;
    }

    .pondpilot-editor pre {
      margin: 0;
      padding: 16px;
      padding-right: 60px;
      background: transparent;
      border: none;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #24292e;
      white-space: pre-wrap;
      word-wrap: break-word;
      tab-size: 2;
    }

    .pondpilot-widget.dark .pondpilot-editor pre {
      color: #e1e4e8;
    }

    .pondpilot-editor[contenteditable="true"] {
      outline: none;
    }

    .pondpilot-editor[contenteditable="true"]:focus-within {
      background: rgba(59, 130, 246, 0.05);
    }

    /* Subtle output */
    .pondpilot-output {
      background: rgba(0, 0, 0, 0.02);
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      max-height: 300px;
      overflow: auto;
      display: none;
      font-size: 12px;
    }

    .pondpilot-widget.dark .pondpilot-output {
      background: rgba(255, 255, 255, 0.02);
      border-top-color: rgba(255, 255, 255, 0.06);
    }

    .pondpilot-output.show {
      display: block;
    }

    .pondpilot-output-content {
      padding: 16px;
    }

    /* Clean tables */
    .pondpilot-output table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .pondpilot-output th,
    .pondpilot-output td {
      text-align: left;
      padding: 8px 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .pondpilot-widget.dark .pondpilot-output th,
    .pondpilot-widget.dark .pondpilot-output td {
      border-bottom-color: rgba(255, 255, 255, 0.06);
    }

    .pondpilot-output th {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
    }

    .pondpilot-widget.dark .pondpilot-output th {
      color: #9ca3af;
    }

    .pondpilot-output td {
      color: #1f2937;
    }

    .pondpilot-widget.dark .pondpilot-output td {
      color: #e5e7eb;
    }

    /* Minimal error */
    .pondpilot-error {
      color: #dc2626;
      padding: 16px;
      font-size: 12px;
      font-family: monospace;
    }

    /* Simple loading */
    .pondpilot-loading {
      text-align: center;
      padding: 24px;
      color: #6b7280;
      font-size: 12px;
    }

    /* Results footer with reset */
    .pondpilot-results-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }

    .pondpilot-widget.dark .pondpilot-results-footer {
      border-top-color: rgba(255, 255, 255, 0.06);
    }

    .pondpilot-results-info {
      font-size: 11px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pondpilot-reset-button {
      font-size: 11px;
      color: #6b7280;
      background: none;
      border: none;
      padding: 2px 8px;
      cursor: pointer;
      border-radius: 3px;
      transition: all 0.15s ease;
    }

    .pondpilot-reset-button:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #374151;
    }

    .pondpilot-widget.dark .pondpilot-reset-button:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #e5e7eb;
    }

    /* Duck logo watermark */
    .pondpilot-duck {
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 20px;
      height: 16px;
      opacity: 0.1;
      transition: opacity 0.2s;
      pointer-events: none;
    }

    .pondpilot-widget:hover .pondpilot-duck {
      opacity: 0.2;
    }

    /* Subtle branding */
    .pondpilot-powered {
      position: absolute;
      bottom: 4px;
      right: 32px;
      font-size: 10px;
      color: #9ca3af;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .pondpilot-widget:hover .pondpilot-powered {
      opacity: 1;
    }

    .pondpilot-powered a {
      color: inherit;
      text-decoration: none;
    }

    .pondpilot-powered a:hover {
      color: #3b82f6;
    }
  `;

  // Widget class
  class PondPilotWidget {
    constructor(element, options = {}) {
      this.element = element;
      this.options = { ...config, ...options };
      this.originalCode = this.extractCode();
      this.init();
    }

    extractCode() {
      const pre = this.element.tagName === 'PRE' ? this.element : this.element.querySelector('pre');
      const code = pre.querySelector('code') || pre;
      return code.textContent.trim();
    }

    init() {
      // Create widget container
      this.widget = document.createElement('div');
      this.widget.className = `pondpilot-widget ${this.options.theme}`;

      // Create editor
      this.editor = this.createEditor();
      this.widget.appendChild(this.editor);

      // Create minimal run button
      this.runButton = this.createRunButton();
      this.widget.appendChild(this.runButton);

      // Create output area
      this.output = this.createOutput();
      this.widget.appendChild(this.output);

      // Create subtle powered by link
      if (this.options.showPoweredBy !== false) {
        this.poweredBy = this.createPoweredBy();
        this.widget.appendChild(this.poweredBy);
      }

      // Add duck watermark
      this.duck = this.createDuckLogo();
      this.widget.appendChild(this.duck);

      // Replace original element
      this.element.parentNode.replaceChild(this.widget, this.element);

      // Load DuckDB
      this.duckdbReady = false;
      this.initDuckDB();
    }

    createRunButton() {
      const button = document.createElement('button');
      button.className = 'pondpilot-run-button';
      button.textContent = 'Run';
      button.onclick = () => this.run();
      return button;
    }

    createEditor() {
      const editor = document.createElement('div');
      editor.className = 'pondpilot-editor';
      editor.contentEditable = this.options.editable !== false;

      const pre = document.createElement('pre');
      pre.textContent = this.originalCode;
      editor.appendChild(pre);

      // Track changes
      editor.addEventListener('input', () => {
        this.currentCode = editor.textContent;
      });

      return editor;
    }

    createOutput() {
      const output = document.createElement('div');
      output.className = 'pondpilot-output';

      const content = document.createElement('div');
      content.className = 'pondpilot-output-content';
      output.appendChild(content);

      return output;
    }

    createPoweredBy() {
      const powered = document.createElement('div');
      powered.className = 'pondpilot-powered';
      powered.innerHTML = `<a href="${this.options.baseUrl}" target="_blank" rel="noopener">PondPilot</a>`;
      return powered;
    }

    createDuckLogo() {
      const duck = document.createElement('div');
      duck.className = 'pondpilot-duck';
      duck.innerHTML = `<svg viewBox="0 0 51 42" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.5 42C6.04416 42 3.25905e-07 35.9558 0 28.5C-3.25905e-07 21.0442 6.04415 15 13.5 15H25.5C32.9558 15 39 21.0442 39 28.5C39 35.9558 32.9558 42 25.5 42H13.5Z" fill-opacity="0.32"/>
        <path d="M31.5 27C24.0442 27 18 20.9558 18 13.5C18 6.04416 24.0442 3.25905e-07 31.5 0C38.9558 -3.25905e-07 45 6.04416 45 13.5C45 20.9558 38.9558 27 31.5 27Z"/>
        <path d="M43.5 15C44.3284 15 45 14.3284 45 13.5C45 12.6716 44.3284 12 43.5 12C42.6716 12 42 12.6716 42 13.5C42 14.3284 42.6716 15 43.5 15Z"/>
        <path d="M31.5 15C32.3284 15 33 14.3284 33 13.5C33 12.6716 32.3284 12 31.5 12C30.6716 12 30 12.6716 30 13.5C30 14.3284 30.6716 15 31.5 15Z"/>
        <path d="M37.5 24C35.0147 24 33 21.9853 33 19.5C33 17.0147 35.0147 15 37.5 15L46.5 15C48.9853 15 51 17.0147 51 19.5C51 21.9853 48.9853 24 46.5 24H37.5Z"/>
        <path d="M30.8908 28.971C30.7628 30.9568 29.94 32.9063 28.4223 34.424C25.1074 37.7388 19.733 37.7388 16.4181 34.424L10.418 28.4238L16.4179 22.4239C19.7327 19.1091 25.1072 19.1091 28.422 22.4239C30.2181 24.22 31.0411 26.6208 30.8908 28.971Z" fill-opacity="0.32"/>
      </svg>`;
      return duck;
    }

    async initDuckDB() {
      try {
        this.runButton.textContent = 'Loading...';
        this.runButton.disabled = true;
        
        // Dynamically import DuckDB WASM
        const duckdbModule = await import(
          'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.1-dev68.0/+esm'
        );
        const duckdb = duckdbModule;
        
        // Get the bundles from jsDelivr
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        
        // Select the best bundle for the browser
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
        
        // Create the worker
        const worker_url = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' }),
        );
        
        const worker = new Worker(worker_url);
        const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
        
        // Initialize the database
        this.db = new duckdb.AsyncDuckDB(logger, worker);
        await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        
        // Create connection
        this.conn = await this.db.connect();
        
        this.duckdbReady = true;
        this.runButton.textContent = 'Run';
        this.runButton.disabled = false;
        
      } catch (error) {
        console.error('Failed to initialize DuckDB:', error);
        this.runButton.textContent = 'Error';
        this.showError('Failed to initialize DuckDB: ' + error.message);
      }
    }

    async run() {
      if (!this.duckdbReady) {
        this.showError('DuckDB is not ready yet');
        return;
      }

      const code = this.editor.textContent.trim();
      if (!code) return;

      this.runButton.disabled = true;
      this.runButton.textContent = 'Running...';
      this.output.classList.add('show');
      
      const outputContent = this.output.querySelector('.pondpilot-output-content');
      outputContent.innerHTML = '<div class="pondpilot-loading">Running query...</div>';

      try {
        const startTime = performance.now();
        const result = await this.conn.query(code);
        const elapsed = Math.round(performance.now() - startTime);
        
        const table = result.toArray();
        const data = table.map((row) => row.toJSON());
        
        this.displayResults(data, elapsed);
        this.runButton.textContent = 'Run';
        
      } catch (error) {
        this.showError(error.message);
        this.runButton.textContent = 'Run';
      } finally {
        this.runButton.disabled = false;
      }
    }

    displayResults(data, elapsed) {
      const outputContent = this.output.querySelector('.pondpilot-output-content');
      
      if (data.length === 0) {
        outputContent.innerHTML = '<div style="text-align: center; color: #6b7280;">No results</div>';
        return;
      }

      // Create table
      const table = document.createElement('table');
      
      // Header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      Object.keys(data[0]).forEach((key) => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Body
      const tbody = document.createElement('tbody');
      data.forEach((row) => {
        const tr = document.createElement('tr');
        Object.values(row).forEach((value) => {
          const td = document.createElement('td');
          td.textContent = value === null ? 'null' : value;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      outputContent.innerHTML = '';
      outputContent.appendChild(table);
      
      // Add footer with info and reset
      const footer = document.createElement('div');
      footer.className = 'pondpilot-results-footer';
      
      // Row count and timing
      const info = document.createElement('div');
      info.className = 'pondpilot-results-info';
      info.textContent = `${data.length} rows • ${elapsed}ms`;
      footer.appendChild(info);
      
      // Reset button
      const resetButton = document.createElement('button');
      resetButton.className = 'pondpilot-reset-button';
      resetButton.textContent = 'Reset';
      resetButton.onclick = () => this.reset();
      footer.appendChild(resetButton);
      
      outputContent.appendChild(footer);
    }

    reset() {
      this.editor.querySelector('pre').textContent = this.originalCode;
      this.output.classList.remove('show');
      this.runButton.textContent = 'Run';
    }

    showError(message) {
      const outputContent = this.output.querySelector('.pondpilot-output-content');
      outputContent.innerHTML = `<div class="pondpilot-error">${message}</div>`;
      this.output.classList.add('show');
    }
  }

  // Initialize widgets
  function init() {
    // Add styles
    if (!document.getElementById('pondpilot-widget-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'pondpilot-widget-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    // Find and initialize widgets
    const elements = document.querySelectorAll(config.selector);
    elements.forEach((element) => {
      if (!element.dataset.pondpilotWidget) {
        element.dataset.pondpilotWidget = 'true';
        new PondPilotWidget(element);
      }
    });
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.PondPilot = {
    init,
    Widget: PondPilotWidget,
    config,
  };
})();