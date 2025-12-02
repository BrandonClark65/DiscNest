# Test Coverage Documentation

This document explains how test coverage is configured and tracked in the DiscNest project.

## Overview

Test coverage is configured using Vitest with the `@vitest/coverage-v8` provider. Coverage thresholds are **not currently enforced** but can be enabled when coverage improves.

## Coverage Configuration

Coverage is configured in `vitest.config.ts` with the following settings:

- **Provider**: v8 (fast and accurate)
- **Thresholds**: Currently disabled (commented out in config)
  - Can be re-enabled by uncommenting thresholds in `vitest.config.ts`
  - Recommended: 80% minimum for lines, statements, functions, branches
- **Reporters**: text, html, json, lcov
- **Output Directory**: `./coverage`

## Running Coverage Reports

### When Files Are Created

- **`coverage/` folder**: Created by **any** command that runs coverage:
  - `npm run test:coverage`
  - `npm run test:coverage:watch`
  - `npm run test:coverage:report`
  - `npm run test:coverage:html`
  
- **`coverage-history.json`**: Created **only** by:
  - `npm run test:coverage:report` (runs the tracker script)

### Basic Coverage Report
```bash
npm run test:coverage
```
Generates a coverage report and saves it to `./coverage/`. Creates the `coverage/` folder if it doesn't exist. Does **not** create `coverage-history.json`.

### Watch Mode with Coverage
```bash
npm run test:coverage:watch
```
Runs tests in watch mode with coverage enabled. Creates/updates the `coverage/` folder. Useful during development. Does **not** create `coverage-history.json`.

### Coverage Report with History Tracking
```bash
npm run test:coverage:report
```
Generates coverage report and tracks metrics over time. Creates/updates:
- `coverage/` folder (from vitest)
- `coverage-history.json` (from tracker script)
- `coverage/coverage-history.html` (from tracker script)

### View HTML Report
```bash
npm run test:coverage:html
```
Generates coverage report and prints the path to the HTML report. Creates/updates the `coverage/` folder. Does **not** create `coverage-history.json`.

### Open Coverage History in Browser
```bash
npm run test:coverage:open
```
Opens the coverage history HTML report (`coverage/coverage-history.html`) in your default browser. Requires that `coverage-history.html` already exists (run `npm run test:coverage:report` first).

## Coverage History Tracking

**Note**: History tracking only occurs when running `npm run test:coverage:report`. The `coverage-history.json` file is **not** created by other coverage commands.

The coverage tracker script (`scripts/coverage-tracker.js`) automatically:

1. Reads the coverage data from `coverage/coverage-final.json` (Istanbul format)
2. Calculates totals and percentages for lines, statements, functions, and branches
3. Saves metrics to `coverage-history.json` with timestamps
4. Generates an HTML history report at `coverage/coverage-history.html`

### Viewing Coverage History

#### JSON Format
Open `coverage-history.json` in any text editor to see raw data with timestamps and metrics.

#### HTML Report
The HTML report provides a formatted, color-coded table showing coverage trends over time. To view it:

**Method 1: Double-click (Easiest)**
- Navigate to `coverage/` folder in File Explorer
- Double-click `coverage-history.html`
- It will open in your default browser

**Method 2: From Command Line**
```bash
# Windows PowerShell
Start-Process "coverage\coverage-history.html"

# Or add to package.json scripts:
npm run test:coverage:open
```

**Method 3: Drag and Drop**
- Open your browser
- Drag `coverage/coverage-history.html` from File Explorer into the browser window

**Method 4: Browser Address Bar**
- Type the full file path in your browser:
  ```
  file:///C:/path/to/discnest/coverage/coverage-history.html
  ```

**Method 5: Right-click → Open With**
- Right-click `coverage-history.html` in File Explorer
- Select "Open with" → Choose your preferred browser

The HTML report shows:
- Color-coded metrics (green ≥80%, yellow ≥60%, red <60%)
- Date and time of each coverage run
- Coverage percentages for lines, statements, functions, and branches
- Total number of entries tracked

The history file keeps the last 100 entries to prevent it from growing too large.

## Coverage Exclusions

The following files/directories are excluded from coverage:

- Test files (`**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`)
- Test utilities and helpers
- Configuration files
- Build outputs (`.next/`, `out/`, `build/`)
- Public assets
- Type definitions
- Constants files
- Layout and page components (Next.js boilerplate)

Only files in `src/**/*.{ts,tsx}` are included in coverage calculations.

## Identifying Untested Code

### Using the HTML Report

1. Run `npm run test:coverage`
2. Open `coverage/index.html` in your browser
3. Navigate through the file tree to see:
   - Files with low coverage (highlighted in red/yellow)
   - Uncovered lines (highlighted in red)
   - Uncovered branches (marked with `E`)

### Using the Terminal Report

The terminal output shows:
- Overall coverage percentages
- Files with low coverage
- Uncovered lines and branches

### Using Coverage Thresholds

**Note**: Thresholds are currently disabled. To enable them:

1. Uncomment the `thresholds` section in `vitest.config.ts`
2. Set your desired percentages (e.g., 80% for all metrics)
3. Test runs will fail if coverage falls below the thresholds

This helps ensure coverage doesn't regress once you're ready to enforce it.

## Coverage Goals

- **Current Status**: Thresholds disabled - tracking coverage without enforcement
- **Future Threshold**: 80% minimum for all metrics (when ready)
- **Target**: 85%+ for critical paths (API routes, lib functions)
- **Focus Areas**: 
  - API route handlers
  - Business logic in `src/lib/`
  - Utility functions
  - Error handling

## CI/CD Integration

To integrate coverage into CI/CD:

1. Run `npm run test:coverage` in your CI pipeline
2. (Optional) Enable thresholds in `vitest.config.ts` to fail builds if coverage drops
3. Upload `coverage/` directory as an artifact
4. Optionally use a service like Codecov or Coveralls for tracking

### Example GitHub Actions Step

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage reports
  uses: actions/upload-artifact@v3
  with:
    name: coverage-reports
    path: coverage/
```

## Troubleshooting

### Coverage Not Generating

1. Ensure `@vitest/coverage-v8` is installed: `npm install --save-dev @vitest/coverage-v8`
2. Check that `vitest.config.ts` has coverage configuration
3. Verify tests are running: `npm test`

### Thresholds Not Enforcing

**Note**: Thresholds are currently disabled. If you want to enable them:

- Uncomment the `thresholds` section in `vitest.config.ts`
- Ensure you're using `vitest run` (not `vitest` in watch mode)
- Verify the coverage provider is correctly configured

### History Not Tracking

- Ensure `coverage/coverage-final.json` exists (run `npm run test:coverage` first)
- Check that `scripts/coverage-tracker.js` has execute permissions
- Verify Node.js can write to the project directory

## Best Practices

1. **Run coverage before committing**: Use `npm run test:coverage` to catch regressions
2. **Track trends**: Use `npm run test:coverage:report` regularly to track coverage over time
3. **Focus on critical paths**: Prioritize coverage for API routes and business logic
4. **Don't chase 100%**: Some files (configs, types) don't need full coverage
5. **Review uncovered code**: Use the HTML report to identify genuinely untested code paths

## Related Files

- `vitest.config.ts` - Coverage configuration
- `scripts/coverage-tracker.js` - History tracking script
- `coverage-history.json` - Historical coverage data
- `coverage/` - Generated coverage reports (gitignored)

