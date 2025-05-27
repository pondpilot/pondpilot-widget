# PondPilot Widget Development Commands
# https://github.com/casey/just

# Default command - show available commands
default:
    @just --list

# Common aliases
alias b := build
alias d := dev
alias s := serve
alias w := watch
alias f := format
alias l := lint
alias t := test
alias c := clean
alias v := version
alias p := publish-dry
alias r := rebuild

# Install dependencies
install:
    npm install

# Build the widget (both minified and unminified)
build:
    npm run build

# Start development server
dev:
    npm run dev

# Clean build artifacts
clean:
    rm -rf dist/
    rm -f *.tgz

# Full rebuild
rebuild: clean build

# Run development server and open browser
serve:
    @echo "Starting development server on http://localhost:8000"
    @python3 -m http.server 8000 & open http://localhost:8000/examples/

# Watch for changes and rebuild automatically
watch:
    @echo "Watching for changes in src/"
    @while true; do \
        fswatch -1 src/pondpilot-widget.js && \
        echo "Changes detected, rebuilding..." && \
        just build && \
        echo "✅ Rebuild complete"; \
    done

# Lint and format code
lint:
    @echo "Running code quality checks..."
    @npx prettier --check src/
    @echo "✅ Code formatting check complete"

# Format code
format:
    @echo "Formatting code..."
    @npx prettier --write src/
    @echo "✅ Code formatted"

# Check for security vulnerabilities
audit:
    npm audit
    @echo "✅ Security audit complete"

# Update dependencies
update:
    npm update
    npm audit fix
    @echo "✅ Dependencies updated"

# Generate SRI hash for the minified build
sri:
    @echo "SRI hash for dist/pondpilot-widget.min.js:"
    @echo "sha384-$(openssl dgst -sha384 -binary dist/pondpilot-widget.min.js | openssl base64 -A)"

# Create a release build with version bump
release version:
    @echo "Creating release {{version}}..."
    npm version {{version}}
    just build
    @echo "✅ Release {{version}} ready"

# Package for NPM (dry run)
pack:
    npm pack --dry-run

# Package for NPM (actual)
pack-real:
    npm pack

# Test NPM package locally
test-package: pack-real
    @echo "Testing package installation..."
    @mkdir -p test-install
    @cd test-install && npm init -y && npm install ../pondpilot-widget-*.tgz
    @echo "✅ Package installed successfully in test-install/"

# Publish to NPM (dry run)
publish-dry:
    npm publish --dry-run

# Publish to NPM
publish:
    @echo "Publishing to NPM..."
    npm publish
    @echo "✅ Published to NPM"
    @echo "Check: https://www.npmjs.com/package/pondpilot-widget"

# Show current version
version:
    @echo "Current version: $(node -p "require('./package.json').version")"

# Show build size info
size:
    @echo "Build sizes:"
    @echo "Original: $(du -h dist/pondpilot-widget.js | cut -f1)"
    @echo "Minified: $(du -h dist/pondpilot-widget.min.js | cut -f1)"
    @echo "Gzipped:  $(gzip -c dist/pondpilot-widget.min.js | wc -c | awk '{print $1/1024 "KB"}')"

# Run a quick test of the widget
test:
    @echo "Opening test page..."
    @open examples/index.html

# Check CDN availability after publish
cdn-check:
    @echo "Checking CDN availability..."
    @curl -s -o /dev/null -w "unpkg: %{http_code}\n" https://unpkg.com/pondpilot-widget
    @curl -s -o /dev/null -w "jsdelivr: %{http_code}\n" https://cdn.jsdelivr.net/npm/pondpilot-widget

# Create git tag for current version
tag:
    @version=$(node -p "require('./package.json').version") && \
    git tag -a "v$$version" -m "Release v$$version" && \
    echo "✅ Tagged v$$version"

# Push tags to remote
push-tags:
    git push origin --tags

# Full release workflow
release-full version: (release version) tag push-tags publish
    @echo "🎉 Release {{version}} complete!"
    @echo "Next steps:"
    @echo "1. Create GitHub release"
    @echo "2. Update documentation"
    @echo "3. Test CDN links"

# Generate TypeScript definitions from JSDoc (if added)
types:
    @echo "TypeScript definitions are manually maintained in dist/pondpilot-widget.d.ts"

# Run all checks before committing
pre-commit: lint audit build test-package
    @echo "✅ All pre-commit checks passed"

# Start a new feature branch
feature name:
    git checkout -b feature/{{name}}
    @echo "✅ Created feature branch: feature/{{name}}"

# Create a pull request (requires gh CLI)
pr:
    gh pr create --web

# Show TODO items in code
todos:
    @grep -r "TODO\|FIXME\|HACK\|XXX" src/ || echo "No TODOs found"

# Open project in editor
edit:
    code .

# Generate example HTML for README
example:
    @echo '<!DOCTYPE html>'
    @echo '<html>'
    @echo '<head>'
    @echo '  <script src="https://unpkg.com/pondpilot-widget"></script>'
    @echo '</head>'
    @echo '<body>'
    @echo '  <pre class="pondpilot-snippet">'
    @echo 'SELECT * FROM generate_series(1, 10) AS t(num);'
    @echo '  </pre>'
    @echo '</body>'
    @echo '</html>'

# Analyze bundle size
analyze:
    @echo "Analyzing bundle..."
    @npx source-map-explorer dist/pondpilot-widget.min.js --html analysis.html 2>/dev/null || echo "Install source-map-explorer: npm i -g source-map-explorer"

# Quick development cycle - build and serve
quick: build serve

# Create a development build with source maps
build-dev:
    @echo "Creating development build with source maps..."
    @node build.js --dev
    @echo "✅ Development build complete"

# Compare with main branch
diff:
    git diff main...HEAD --stat

# Show recent changes
changes:
    git log --oneline -10

# Create screenshots for documentation
screenshots:
    @echo "Please manually create screenshots and save to docs/images/"
    @open examples/index.html

# Validate package.json
validate:
    @npx package-json-validator package.json || echo "Install validator: npm i -g package-json-validator"

# Check for outdated dependencies
outdated:
    npm outdated

# Run memory leak test (basic)
leak-test:
    @echo "Opening memory profiler test page..."
    @echo "Use Chrome DevTools Memory Profiler to check for leaks"
    @open examples/index.html

# Archive current version
archive:
    @version=$(node -p "require('./package.json').version") && \
    tar -czf "releases/pondpilot-widget-v$$version.tar.gz" dist/ README.md LICENSE && \
    echo "✅ Archived as releases/pondpilot-widget-v$$version.tar.gz"

# Help - show detailed command descriptions
help:
    @echo "PondPilot Widget Development Commands"
    @echo "===================================="
    @echo ""
    @echo "Development:"
    @echo "  just dev          - Start development server"
    @echo "  just build        - Build the widget"
    @echo "  just watch        - Watch and rebuild on changes"
    @echo "  just serve        - Start server and open browser"
    @echo ""
    @echo "Quality:"
    @echo "  just lint         - Check code formatting"
    @echo "  just format       - Format code"
    @echo "  just audit        - Check security vulnerabilities"
    @echo ""
    @echo "Release:"
    @echo "  just release X.Y.Z - Create a new release"
    @echo "  just publish      - Publish to NPM"
    @echo "  just tag          - Create git tag"
    @echo ""
    @echo "Testing:"
    @echo "  just test         - Open test page"
    @echo "  just test-package - Test NPM package locally"
    @echo ""
    @echo "Info:"
    @echo "  just size         - Show build sizes"
    @echo "  just version      - Show current version"
    @echo "  just sri          - Generate SRI hash"