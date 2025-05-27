# Publishing Guide

## Pre-Publication Checklist

### 1. **Version Management**
- [ ] Update version in `package.json`
- [ ] Update version in `src/pondpilot-widget.js` banner
- [ ] Update `CHANGELOG.md` with release notes
- [ ] Tag the release in git

### 2. **Build & Test**
```bash
# Clean build
rm -rf dist/
npm run build

# Test the build
npm run dev
# Open examples/index.html in browser

# Check package contents
npm pack --dry-run
```

### 3. **Documentation**
- [ ] README.md is up to date
- [ ] API documentation is complete
- [ ] Examples work correctly
- [ ] TypeScript definitions match API

### 4. **Security Audit**
```bash
# Check for vulnerabilities
npm audit

# Update dependencies if needed
npm update
```

## Publishing to NPM

### First Time Setup
```bash
# Login to NPM
npm login

# Verify you're logged in
npm whoami
```

### Publishing
```bash
# Dry run first
npm publish --dry-run

# Publish to NPM
npm publish

# For beta/preview releases
npm publish --tag beta
```

## CDN Availability

After publishing to NPM, the package will be automatically available on:

### unpkg
- Latest: `https://unpkg.com/pondpilot-widget`
- Specific: `https://unpkg.com/pondpilot-widget@1.0.0`
- Browse: `https://unpkg.com/browse/pondpilot-widget@1.0.0/`

### jsDelivr
- Latest: `https://cdn.jsdelivr.net/npm/pondpilot-widget`
- Specific: `https://cdn.jsdelivr.net/npm/pondpilot-widget@1.0.0`
- Minified: `https://cdn.jsdelivr.net/npm/pondpilot-widget@1.0.0/dist/pondpilot-widget.min.js`

### CDN Features
- Both CDNs provide automatic minification
- jsDelivr offers combining multiple files
- unpkg provides directory browsing
- Both support SRI (Subresource Integrity)

## Post-Publication

### 1. **Verify CDN Access**
```bash
# Test unpkg
curl -I https://unpkg.com/pondpilot-widget

# Test jsDelivr
curl -I https://cdn.jsdelivr.net/npm/pondpilot-widget
```

### 2. **Update Documentation**
- Update any installation docs with new version
- Create GitHub release with changelog
- Update example CodePens/JSFiddles

### 3. **Generate SRI Hashes**
```bash
# Generate SRI hash for the minified version
openssl dgst -sha384 -binary dist/pondpilot-widget.min.js | openssl base64 -A
```

Add to documentation:
```html
<script 
  src="https://unpkg.com/pondpilot-widget@1.0.0/dist/pondpilot-widget.min.js"
  integrity="sha384-[generated-hash]"
  crossorigin="anonymous">
</script>
```

## Version Strategy

### Semantic Versioning
- **Major** (1.0.0): Breaking API changes
- **Minor** (1.1.0): New features, backwards compatible
- **Patch** (1.0.1): Bug fixes

### Pre-releases
```bash
# Beta release
npm version 1.1.0-beta.1
npm publish --tag beta

# RC release  
npm version 1.1.0-rc.1
npm publish --tag rc
```

### Deprecation
```bash
# Deprecate old versions
npm deprecate pondpilot-widget@"< 1.0.0" "Please upgrade to 1.0.0 or higher"
```

## Rollback Plan

If issues are discovered post-publish:

```bash
# Unpublish (within 72 hours)
npm unpublish pondpilot-widget@1.0.0

# Or deprecate with message
npm deprecate pondpilot-widget@1.0.0 "Critical bug, please use 1.0.1"
```

## Best Practices

1. **Always test locally first**: `npm pack` and install the `.tgz` file
2. **Use `npm publish --dry-run`** to see what will be published
3. **Tag pre-releases appropriately** (beta, rc, next)
4. **Update CDN examples** in documentation after publish
5. **Monitor npm download stats** at https://www.npmjs.com/package/pondpilot-widget
6. **Set up automated publishing** via GitHub Actions (optional)

## Troubleshooting

### "You cannot publish over previously published version"
- Bump the version in package.json
- Run `npm version patch/minor/major`

### "No auth token found"
- Run `npm login`
- Check `~/.npmrc` for auth token

### CDN not updating
- CDNs cache for a few minutes
- Use specific version URLs during testing
- Clear browser cache or use incognito mode