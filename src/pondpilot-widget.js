/**
 * PondPilot Widget - Minimal version
 * Transform static SQL code blocks into interactive snippets
 */

(function () {
  "use strict";

  // Inline sql-highlight library (minified)
  // Source: https://github.com/scriptcoded/sql-highlight (MIT License)
  const sqlHighlight = (function() {
    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL', 
      'ORDER', 'BY', 'GROUP', 'HAVING', 'UNION', 'ALL', 'LIMIT', 'OFFSET', 'FETCH', 'FIRST', 'NEXT', 'ONLY', 'ROWS',
      'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW',
      'TRIGGER', 'FUNCTION', 'PROCEDURE', 'DATABASE', 'SCHEMA', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE',
      'CHECK', 'DEFAULT', 'CONSTRAINT', 'CASCADE', 'RESTRICT', 'IF', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
      'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'ON', 'AS', 'DISTINCT', 'WITH', 'RECURSIVE',
      'CAST', 'CONVERT', 'COALESCE', 'NULLIF', 'GREATEST', 'LEAST', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
      'ROUND', 'FLOOR', 'CEIL', 'ABS', 'SIGN', 'MOD', 'SQRT', 'POWER', 'EXP', 'LOG', 'LN', 'CONCAT', 'LENGTH',
      'SUBSTRING', 'REPLACE', 'TRIM', 'UPPER', 'LOWER', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP',
      'EXTRACT', 'DATE_ADD', 'DATE_SUB', 'DATEDIFF', 'NOW', 'CURDATE', 'CURTIME'];

    function getSegments(sqlString) {
      const segments = [];
      const len = sqlString.length;
      let i = 0;

      while (i < len) {
        // Skip whitespace
        if (/\s/.test(sqlString[i])) {
          let j = i;
          while (j < len && /\s/.test(sqlString[j])) j++;
          segments.push({ name: 'whitespace', content: sqlString.slice(i, j) });
          i = j;
          continue;
        }

        // Comments
        if (sqlString[i] === '-' && sqlString[i + 1] === '-') {
          let j = i + 2;
          while (j < len && sqlString[j] !== '\n') j++;
          segments.push({ name: 'comment', content: sqlString.slice(i, j) });
          i = j;
          continue;
        }
        
        // Multi-line comments
        if (sqlString[i] === '/' && sqlString[i + 1] === '*') {
          let j = i + 2;
          while (j < len - 1 && !(sqlString[j] === '*' && sqlString[j + 1] === '/')) j++;
          if (j < len - 1) j += 2;
          segments.push({ name: 'comment', content: sqlString.slice(i, j) });
          i = j;
          continue;
        }

        // Strings
        if (sqlString[i] === "'" || sqlString[i] === '"') {
          const quote = sqlString[i];
          let j = i + 1;
          while (j < len && sqlString[j] !== quote) {
            if (sqlString[j] === '\\') j++;
            j++;
          }
          if (j < len) j++;
          segments.push({ name: 'string', content: sqlString.slice(i, j) });
          i = j;
          continue;
        }

        // Numbers
        if (/\d/.test(sqlString[i])) {
          let j = i;
          while (j < len && /[\d.]/.test(sqlString[j])) j++;
          segments.push({ name: 'number', content: sqlString.slice(i, j) });
          i = j;
          continue;
        }

        // Identifiers and keywords
        if (/[a-zA-Z_]/.test(sqlString[i])) {
          let j = i;
          while (j < len && /[a-zA-Z0-9_]/.test(sqlString[j])) j++;
          const word = sqlString.slice(i, j);
          const upperWord = word.toUpperCase();
          if (keywords.includes(upperWord)) {
            segments.push({ name: 'keyword', content: word });
          } else {
            segments.push({ name: 'identifier', content: word });
          }
          i = j;
          continue;
        }

        // Special characters
        if (/[(),.;=<>!+\-*/]/.test(sqlString[i])) {
          segments.push({ name: 'special', content: sqlString[i] });
          i++;
          continue;
        }

        // Backticks (MySQL style identifiers)
        if (sqlString[i] === '`') {
          let j = i + 1;
          while (j < len && sqlString[j] !== '`') j++;
          if (j < len) j++;
          segments.push({ name: 'identifier', content: sqlString.slice(i, j) });
          i = j;
          continue;
        }

        // Default
        segments.push({ name: 'other', content: sqlString[i] });
        i++;
      }

      return segments;
    }

    function highlight(sqlString, options = {}) {
      const segments = getSegments(sqlString);
      
      if (options.html) {
        return segments.map(segment => {
          const className = 'sql-hl-' + segment.name;
          const escaped = segment.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          return segment.name === 'whitespace' 
            ? escaped 
            : `<span class="${className}">${escaped}</span>`;
        }).join('');
      }
      
      return sqlString; // Plain text for now
    }

    return { highlight, getSegments };
  })();

  // Constants
  const CONSTANTS = {
    DEBOUNCE_DELAY: 150, // ms
    LARGE_SQL_THRESHOLD: 500, // characters
    MAX_OUTPUT_HEIGHT: 300, // px
    PROGRESS_STEPS: {
      MODULE_LOADING: 10,
      FETCHING_BUNDLES: 20,
      SELECTING_BUNDLE: 30,
      CREATING_WORKER: 40,
      INITIALIZING_DB: 60,
      LOADING_MODULE: 80,
      CREATING_CONNECTION: 90,
      COMPLETE: 100
    }
  };

  // Widget configuration
  const config = {
    selector: "pre.pondpilot-snippet, .pondpilot-snippet pre",
    baseUrl: window.PONDPILOT_BASE_URL || "http://localhost:5173",
    theme: "light",
    autoInit: true,
    // DuckDB CDN settings - update version and add integrity hashes for security
    duckdbVersion: "1.29.1-dev68.0",
    duckdbCDN: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm",
    // Optional: Add integrity hashes when available from DuckDB releases
    // duckdbIntegrity: { main: "sha384-...", worker: "sha384-..." }
  };

  // Shared DuckDB instance
  let sharedDuckDB = null;
  let duckDBInitPromise = null;

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

    /* Reset button in editor */
    .pondpilot-reset-button {
      position: absolute;
      top: 8px;
      right: 60px;
      z-index: 10;
      padding: 4px 8px;
      background: rgba(107, 114, 128, 0.1);
      color: #6b7280;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      opacity: 0;
      visibility: hidden;
    }

    .pondpilot-widget:hover .pondpilot-reset-button.show,
    .pondpilot-reset-button.show:hover {
      opacity: 1;
      visibility: visible;
    }

    .pondpilot-reset-button:hover {
      background: rgba(107, 114, 128, 0.2);
      color: #374151;
    }

    .pondpilot-widget.dark .pondpilot-reset-button:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #e5e7eb;
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
      max-height: ` + CONSTANTS.MAX_OUTPUT_HEIGHT + `px;
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

    /* Loading progress */
    .pondpilot-progress {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px;
    }

    .pondpilot-progress-bar {
      width: 200px;
      height: 4px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .pondpilot-widget.dark .pondpilot-progress-bar {
      background: rgba(255, 255, 255, 0.1);
    }

    .pondpilot-progress-fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .pondpilot-progress-text {
      font-size: 12px;
      color: #6b7280;
    }

    /* Results footer */
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

    /* Duck logo watermark */
    .pondpilot-duck {
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 20px;
      height: 16px;
      opacity: 0.1;
      transition: opacity 0.2s;
      cursor: pointer;
      z-index: 5;
      color: inherit;
      display: block;
    }

    .pondpilot-widget:hover .pondpilot-duck {
      opacity: 0.2;
    }

    .pondpilot-duck:hover {
      opacity: 0.3;
      transform: scale(1.1);
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

    /* SQL syntax highlighting */
    .sql-hl-keyword {
      color: #0969da;
      font-weight: 600;
    }

    .pondpilot-widget.dark .sql-hl-keyword {
      color: #7ee787;
    }

    .sql-hl-string {
      color: #032f62;
    }

    .pondpilot-widget.dark .sql-hl-string {
      color: #a5d6ff;
    }

    .sql-hl-number {
      color: #0550ae;
    }

    .pondpilot-widget.dark .sql-hl-number {
      color: #79c0ff;
    }

    .sql-hl-comment {
      color: #6e7781;
      font-style: italic;
    }

    .pondpilot-widget.dark .sql-hl-comment {
      color: #8b949e;
    }

    .sql-hl-special {
      color: #cf222e;
    }

    .pondpilot-widget.dark .sql-hl-special {
      color: #ff7b72;
    }

    .sql-hl-identifier {
      color: #953800;
    }

    .pondpilot-widget.dark .sql-hl-identifier {
      color: #ffa657;
    }
  `;


  // Utility functions
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Widget class
  class PondPilotWidget {
    constructor(element, options = {}) {
      this.element = element;
      this.options = { ...config, ...options };
      this.originalCode = this.extractCode();
      this.init();
    }

    extractCode() {
      const pre = this.element.tagName === "PRE" ? this.element : this.element.querySelector("pre");
      const code = pre.querySelector("code") || pre;
      return code.textContent.trim();
    }

    init() {
      // Create widget container
      this.widget = document.createElement("div");
      this.widget.className = `pondpilot-widget ${this.options.theme}`;

      // Create editor
      this.editor = this.createEditor();
      this.widget.appendChild(this.editor);

      // Create minimal run button
      this.runButton = this.createRunButton();
      this.widget.appendChild(this.runButton);

      // Create reset button
      this.resetButton = this.createResetButton();
      this.widget.appendChild(this.resetButton);

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

      // DuckDB will be loaded on first interaction
      this.duckdbReady = false;
    }

    createRunButton() {
      const button = document.createElement("button");
      button.className = "pondpilot-run-button";
      button.textContent = "Run";
      button.setAttribute('aria-label', 'Run SQL query');
      button.onclick = () => this.run();
      return button;
    }

    createResetButton() {
      const button = document.createElement("button");
      button.className = "pondpilot-reset-button";
      button.textContent = "Reset";
      button.setAttribute('aria-label', 'Reset to original SQL');
      button.onclick = () => this.reset();
      return button;
    }

    getCursorOffset(element, range) {
      const preRange = range.cloneRange();
      preRange.selectNodeContents(element);
      preRange.setEnd(range.endContainer, range.endOffset);
      return preRange.toString().length;
    }

    setCursorOffset(element, offset) {
      const textNodes = this.getTextNodes(element);
      let currentOffset = 0;
      
      for (const node of textNodes) {
        const nodeLength = node.textContent.length;
        if (currentOffset + nodeLength >= offset) {
          const range = document.createRange();
          range.setStart(node, offset - currentOffset);
          range.collapse(true);
          
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          break;
        }
        currentOffset += nodeLength;
      }
    }

    getTextNodes(element) {
      const textNodes = [];
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
      return textNodes;
    }

    createEditor() {
      const editor = document.createElement("div");
      editor.className = "pondpilot-editor";

      const pre = document.createElement("pre");
      pre.innerHTML = sqlHighlight.highlight(this.originalCode, { html: true });
      editor.appendChild(pre);
      
      // Initialize current code
      this.currentCode = this.originalCode;

      // Make the pre element editable
      if (this.options.editable !== false) {
        pre.contentEditable = true;
        pre.spellcheck = false;
        pre.setAttribute('role', 'textbox');
        pre.setAttribute('aria-label', 'SQL editor');
        pre.setAttribute('aria-multiline', 'true');
        
        // Create debounced highlight function
        const highlightDebounced = debounce((text, cursorOffset) => {
          // Re-highlight
          pre.innerHTML = sqlHighlight.highlight(text, { html: true });
          
          // Restore cursor position
          this.setCursorOffset(pre, cursorOffset);
          
          // Update reset button visibility
          if (text !== this.originalCode) {
            this.resetButton.classList.add("show");
          } else {
            this.resetButton.classList.remove("show");
          }
        }, CONSTANTS.DEBOUNCE_DELAY); // Debounce for smooth typing
        
        // Track changes and re-highlight
        pre.addEventListener("input", () => {
          const text = pre.textContent;
          this.currentCode = text;
          
          // Preserve cursor position
          const selection = window.getSelection();
          const range = selection.getRangeAt(0);
          const cursorOffset = this.getCursorOffset(pre, range);
          
          // For small text, highlight immediately, for large text debounce
          if (text.length < CONSTANTS.LARGE_SQL_THRESHOLD) {
            // Re-highlight immediately for small SQL
            pre.innerHTML = sqlHighlight.highlight(text, { html: true });
            this.setCursorOffset(pre, cursorOffset);
            
            // Update reset button visibility
            if (text !== this.originalCode) {
              this.resetButton.classList.add("show");
            } else {
              this.resetButton.classList.remove("show");
            }
          } else {
            // Debounce for large SQL
            highlightDebounced(text, cursorOffset);
          }
        });
      }

      // Add keyboard shortcut (Ctrl/Cmd + Enter to run)
      editor.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          this.run();
        }
      });

      return editor;
    }

    createOutput() {
      const output = document.createElement("div");
      output.className = "pondpilot-output";

      const content = document.createElement("div");
      content.className = "pondpilot-output-content";
      output.appendChild(content);

      return output;
    }

    createPoweredBy() {
      const powered = document.createElement("div");
      powered.className = "pondpilot-powered";
      powered.innerHTML = `<a href="${this.options.baseUrl}" target="_blank" rel="noopener">PondPilot</a>`;
      return powered;
    }

    createDuckLogo() {
      const duck = document.createElement("a");
      duck.href = this.options.baseUrl;
      duck.target = "_blank";
      duck.rel = "noopener";
      duck.className = "pondpilot-duck";
      duck.title = "Open in PondPilot";
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
        this.runButton.textContent = "Loading...";
        this.runButton.disabled = true;

        // Show loading progress
        this.showProgress("Initializing DuckDB...", 0);

        // Use shared DuckDB instance if available
        if (!duckDBInitPromise) {
          duckDBInitPromise = this.createSharedDuckDB((progress, message) => {
            this.showProgress(message, progress);
          });
        }

        await duckDBInitPromise;

        // Create a connection to the shared database
        this.showProgress("Creating connection...", CONSTANTS.PROGRESS_STEPS.CREATING_CONNECTION);
        this.conn = await sharedDuckDB.connect();

        this.duckdbReady = true;
        this.runButton.textContent = "Run";
        this.runButton.disabled = false;

        // Hide progress
        this.output.classList.remove("show");
      } catch (error) {
        console.error("Failed to initialize DuckDB:", error);
        this.runButton.textContent = "Error";
        this.showError("Failed to initialize DuckDB: " + error.message);
      }
    }

    showProgress(message, percent) {
      const outputContent = this.output.querySelector(".pondpilot-output-content");
      const safePercent = Math.min(100, Math.max(0, percent));
      outputContent.innerHTML = `
        <div class="pondpilot-progress" role="status" aria-live="polite">
          <div class="pondpilot-progress-text">${escapeHtml(message)}</div>
          <div class="pondpilot-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${safePercent}" aria-label="Loading progress">
            <div class="pondpilot-progress-fill" style="width: ${safePercent}%"></div>
          </div>
        </div>
      `;
      this.output.classList.add("show");
    }

    async createSharedDuckDB(progressCallback) {
      try {
        // Track which widget initiated the loading
        this.progressCallback = progressCallback || (() => {});

        // Dynamically import DuckDB WASM
        this.progressCallback(CONSTANTS.PROGRESS_STEPS.MODULE_LOADING, "Loading DuckDB module...");
        const duckdbUrl = `${config.duckdbCDN}@${config.duckdbVersion}/+esm`;
        const duckdbModule = await import(duckdbUrl);
        const duckdb = duckdbModule;

        // Get the bundles from jsDelivr
        this.progressCallback(CONSTANTS.PROGRESS_STEPS.FETCHING_BUNDLES, "Fetching bundles...");
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

        // Select the best bundle for the browser
        this.progressCallback(CONSTANTS.PROGRESS_STEPS.SELECTING_BUNDLE, "Selecting best bundle...");
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        // Create the worker - try direct URL first for CSP compatibility
        this.progressCallback(CONSTANTS.PROGRESS_STEPS.CREATING_WORKER, "Creating worker...");
        let worker;
        try {
          // First try direct worker URL (CSP-friendly)
          worker = new Worker(bundle.mainWorker);
        } catch (e) {
          // Fallback to blob URL if direct loading fails
          try {
            const worker_url = URL.createObjectURL(new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" }));
            worker = new Worker(worker_url);
          } catch (blobError) {
            throw new Error("Failed to create worker. This may be due to Content Security Policy restrictions. Please ensure your site allows worker-src 'self' blob: or use a CSP-compatible hosting setup.");
          }
        }
        const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);

        // Initialize the shared database
        this.progressCallback(CONSTANTS.PROGRESS_STEPS.INITIALIZING_DB, "Initializing database...");
        sharedDuckDB = new duckdb.AsyncDuckDB(logger, worker);

        this.progressCallback(CONSTANTS.PROGRESS_STEPS.LOADING_MODULE, "Loading PondPilot module...");
        await sharedDuckDB.instantiate(bundle.mainModule, bundle.pthreadWorker);

        return sharedDuckDB;
      } catch (error) {
        throw error;
      }
    }

    async run() {
      const code = this.currentCode || this.editor.querySelector('pre').textContent.trim();
      if (!code) return;

      // Initialize DuckDB on first run
      if (!this.duckdbReady) {
        await this.initDuckDB();
        if (!this.duckdbReady) {
          return; // Error was already shown by initDuckDB
        }
      }

      this.runButton.disabled = true;
      this.runButton.textContent = "Running...";
      this.output.classList.add("show");

      const outputContent = this.output.querySelector(".pondpilot-output-content");
      outputContent.innerHTML = '<div class="pondpilot-loading">Running query...</div>';

      try {
        const startTime = performance.now();
        const result = await this.conn.query(code);
        const elapsed = Math.round(performance.now() - startTime);

        const table = result.toArray();
        const data = table.map((row) => row.toJSON());

        this.displayResults(data, elapsed);
        this.runButton.textContent = "Run";
      } catch (error) {
        this.showError(error.message);
        this.runButton.textContent = "Run";
      } finally {
        this.runButton.disabled = false;
      }
    }

    displayResults(data, elapsed) {
      const outputContent = this.output.querySelector(".pondpilot-output-content");

      if (data.length === 0) {
        outputContent.innerHTML = '<div style="text-align: center; color: #6b7280;">No results</div>';
        return;
      }

      // Create table
      const table = document.createElement("table");

      // Header
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      Object.keys(data[0]).forEach((key) => {
        const th = document.createElement("th");
        th.textContent = key;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Body
      const tbody = document.createElement("tbody");
      data.forEach((row) => {
        const tr = document.createElement("tr");
        Object.values(row).forEach((value) => {
          const td = document.createElement("td");
          td.textContent = value === null ? "null" : String(value);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      outputContent.innerHTML = "";
      outputContent.appendChild(table);

      // Add footer with info
      const footer = document.createElement("div");
      footer.className = "pondpilot-results-footer";

      // Row count and timing
      const info = document.createElement("div");
      info.className = "pondpilot-results-info";
      info.textContent = `${data.length} rows • ${elapsed}ms`;
      footer.appendChild(info);

      outputContent.appendChild(footer);

      // Show reset button
      this.resetButton.classList.add("show");
    }

    reset() {
      this.editor.querySelector("pre").innerHTML = sqlHighlight.highlight(this.originalCode, { html: true });
      this.output.classList.remove("show");
      this.runButton.textContent = "Run";
      this.resetButton.classList.remove("show");
      this.currentCode = this.originalCode;
    }

    showError(message) {
      const outputContent = this.output.querySelector(".pondpilot-output-content");

      // Improve common error messages
      let improvedMessage = message;
      let suggestion = "";

      if (message.includes("no such table") || message.includes("does not exist")) {
        suggestion = "Tip: Make sure to CREATE TABLE before querying it.";
      } else if (message.includes("syntax error") || message.includes("Parser Error")) {
        suggestion = "Tip: Check your SQL syntax. Common issues: missing semicolon, typos in keywords.";
      } else if (message.includes("no such column")) {
        suggestion = "Tip: Check column names for typos and ensure they exist in the table.";
      } else if (message.includes("SharedArrayBuffer") || message.includes("COOP") || message.includes("COEP")) {
        improvedMessage = "Browser security error";
        suggestion =
          "Your browser requires special headers for DuckDB WASM. Try using Chrome or Firefox, or contact your site administrator.";
      } else if (message.includes("Out of Memory")) {
        improvedMessage = "Memory limit exceeded";
        suggestion = "Tip: Try using LIMIT to reduce result size, or process data in smaller chunks.";
      }

      outputContent.innerHTML = `
        <div class="pondpilot-error" role="alert" aria-live="assertive">
          <div>${escapeHtml(improvedMessage)}</div>
          ${suggestion ? `<div style="margin-top: 8px; opacity: 0.8; font-size: 11px;">${escapeHtml(suggestion)}</div>` : ""}
        </div>
      `;
      this.output.classList.add("show");

      // Show reset button on error
      this.resetButton.classList.add("show");
    }

    async cleanup() {
      // Close the connection when widget is destroyed
      if (this.conn) {
        await this.conn.close();
        this.conn = null;
      }
      // Remove event listeners
      if (this.highlightDebounced) {
        this.highlightDebounced = null;
      }
    }

    destroy() {
      // Call async cleanup
      this.cleanup().catch(console.error);
      
      // Remove from instances
      widgetInstances.delete(this.widget);
      
      // Clear references
      this.widget = null;
      this.editor = null;
      this.output = null;
      this.runButton = null;
      this.resetButton = null;
    }
  }

  // Track all widget instances for cleanup
  const widgetInstances = new WeakMap();

  // Initialize widgets
  function init() {
    // Add styles
    if (!document.getElementById("pondpilot-widget-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "pondpilot-widget-styles";
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    // Find and initialize widgets
    const elements = document.querySelectorAll(config.selector);
    elements.forEach((element) => {
      if (!element.dataset.pondpilotWidget) {
        element.dataset.pondpilotWidget = "true";
        const widget = new PondPilotWidget(element);
        widgetInstances.set(widget.widget, widget);
      }
    });
  }

  // Auto-initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Set up mutation observer to clean up removed widgets
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        // Check if the removed node or its descendants contain widgets
        if (node.nodeType === Node.ELEMENT_NODE) {
          const widgets = node.classList?.contains('pondpilot-widget') 
            ? [node] 
            : node.querySelectorAll?.('.pondpilot-widget') || [];
          
          widgets.forEach((widgetElement) => {
            const widget = widgetInstances.get(widgetElement);
            if (widget) {
              widget.destroy();
            }
          });
        }
      });
    });
  });

  // Start observing once DOM is ready
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Expose API
  window.PondPilot = {
    init,
    Widget: PondPilotWidget,
    config,
    destroy: () => {
      // Clean up all widgets
      document.querySelectorAll('.pondpilot-widget').forEach((element) => {
        const widget = widgetInstances.get(element);
        if (widget) {
          widget.destroy();
        }
      });
      // Stop observing
      observer.disconnect();
    }
  };
})();
