/**
 * Coverage Tracker Script
 * 
 * Tracks test coverage over time by reading the coverage JSON report
 * and saving metrics to a history file.
 * 
 * Usage: node scripts/coverage-tracker.js
 * 
 * This script should be run after generating coverage reports:
 * npm run test:coverage:report
 */

const fs = require("fs");
const path = require("path");

const COVERAGE_DIR = path.join(__dirname, "..", "coverage");
const COVERAGE_JSON = path.join(COVERAGE_DIR, "coverage-final.json");
const HISTORY_FILE = path.join(__dirname, "..", "coverage-history.json");
const HISTORY_HTML = path.join(COVERAGE_DIR, "coverage-history.html");

function readCoverageData() {
  try {
    if (!fs.existsSync(COVERAGE_JSON)) {
      console.error("❌ Coverage data not found. Run 'npm run test:coverage' first.");
      process.exit(1);
    }
    
    const content = fs.readFileSync(COVERAGE_JSON, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("❌ Error reading coverage data:", error.message);
    process.exit(1);
  }
}

function calculateMetrics(coverageData) {
  // Parse Istanbul format coverage data and calculate totals
  let totalStatements = 0;
  let coveredStatements = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  let totalLines = 0;
  let coveredLines = 0;

  // Iterate through all files in coverage data
  for (const filePath in coverageData) {
    const file = coverageData[filePath];
    if (!file || typeof file !== 'object') continue;

    // Count statements (s)
    if (file.s) {
      for (const stmtId in file.s) {
        totalStatements++;
        if (file.s[stmtId] > 0) {
          coveredStatements++;
        }
      }
    }

    // Count functions (f)
    if (file.f) {
      for (const fnId in file.f) {
        totalFunctions++;
        if (file.f[fnId] > 0) {
          coveredFunctions++;
        }
      }
    }

    // Count branches (b)
    if (file.b) {
      for (const branchId in file.b) {
        const branch = file.b[branchId];
        if (Array.isArray(branch)) {
          // Each branch has multiple locations
          totalBranches += branch.length;
          coveredBranches += branch.filter(count => count > 0).length;
        }
      }
    }

    // Estimate lines from statement map
    if (file.statementMap) {
      const lineSet = new Set();
      const coveredLineSet = new Set();
      
      for (const stmtId in file.statementMap) {
        const stmt = file.statementMap[stmtId];
        if (stmt && stmt.start && stmt.end) {
          const startLine = stmt.start.line;
          const endLine = stmt.end.line;
          
          for (let line = startLine; line <= endLine; line++) {
            lineSet.add(line);
            if (file.s && file.s[stmtId] > 0) {
              coveredLineSet.add(line);
            }
          }
        }
      }
      
      totalLines += lineSet.size;
      coveredLines += coveredLineSet.size;
    }
  }

  // Calculate percentages
  const statementsPct = totalStatements > 0 
    ? (coveredStatements / totalStatements) * 100 
    : 0;
  const functionsPct = totalFunctions > 0 
    ? (coveredFunctions / totalFunctions) * 100 
    : 0;
  const branchesPct = totalBranches > 0 
    ? (coveredBranches / totalBranches) * 100 
    : 0;
  const linesPct = totalLines > 0 
    ? (coveredLines / totalLines) * 100 
    : 0;

  return {
    lines: {
      total: totalLines,
      covered: coveredLines,
      pct: linesPct,
    },
    statements: {
      total: totalStatements,
      covered: coveredStatements,
      pct: statementsPct,
    },
    functions: {
      total: totalFunctions,
      covered: coveredFunctions,
      pct: functionsPct,
    },
    branches: {
      total: totalBranches,
      covered: coveredBranches,
      pct: branchesPct,
    },
  };
}

function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(HISTORY_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.warn("⚠️  Error reading history file, starting fresh:", error.message);
    return [];
  }
}

function saveHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    console.log(`✅ Coverage history saved to ${HISTORY_FILE}`);
  } catch (error) {
    console.error("❌ Error saving history:", error.message);
    process.exit(1);
  }
}

function generateHistoryHTML(history) {
  if (history.length === 0) {
    return;
  }

  const rows = history
    .map((entry) => {
      const date = new Date(entry.timestamp).toLocaleString();
      return `
        <tr>
          <td>${date}</td>
          <td class="${getColorClass(entry.metrics.lines.pct)}">${entry.metrics.lines.pct.toFixed(2)}%</td>
          <td class="${getColorClass(entry.metrics.statements.pct)}">${entry.metrics.statements.pct.toFixed(2)}%</td>
          <td class="${getColorClass(entry.metrics.functions.pct)}">${entry.metrics.functions.pct.toFixed(2)}%</td>
          <td class="${getColorClass(entry.metrics.branches.pct)}">${entry.metrics.branches.pct.toFixed(2)}%</td>
        </tr>
      `;
    })
    .reverse()
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coverage History - DiscNest</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #0070f3;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    th {
      background: #0070f3;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    tr:hover {
      background: #f9f9f9;
    }
    .good { color: #22c55e; font-weight: 600; }
    .warning { color: #f59e0b; font-weight: 600; }
    .poor { color: #ef4444; font-weight: 600; }
    .info {
      background: #e0f2fe;
      border-left: 4px solid #0070f3;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>📊 Test Coverage History</h1>
  <div class="info">
    <strong>Last updated:</strong> ${new Date().toLocaleString()}<br>
    <strong>Total entries:</strong> ${history.length}<br>
    <strong>Threshold:</strong> 80% minimum
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Lines</th>
        <th>Statements</th>
        <th>Functions</th>
        <th>Branches</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;

  try {
    fs.writeFileSync(HISTORY_HTML, html);
    console.log(`✅ Coverage history HTML generated at ${HISTORY_HTML}`);
  } catch (error) {
    console.warn("⚠️  Could not generate HTML history:", error.message);
  }
}

function getColorClass(pct) {
  if (pct >= 80) return "good";
  if (pct >= 60) return "warning";
  return "poor";
}

function main() {
  console.log("📊 Tracking coverage metrics...\n");

  const coverageData = readCoverageData();
  const metrics = calculateMetrics(coverageData);
  const history = loadHistory();

  const entry = {
    timestamp: new Date().toISOString(),
    metrics,
  };

  history.push(entry);

  // Keep only last 100 entries
  if (history.length > 100) {
    history.shift();
  }

  saveHistory(history);
  generateHistoryHTML(history);

  console.log("\n📈 Current Coverage:");
  console.log(`   Lines:      ${metrics.lines.pct.toFixed(2)}% (${metrics.lines.covered}/${metrics.lines.total})`);
  console.log(`   Statements: ${metrics.statements.pct.toFixed(2)}% (${metrics.statements.covered}/${metrics.statements.total})`);
  console.log(`   Functions:  ${metrics.functions.pct.toFixed(2)}% (${metrics.functions.covered}/${metrics.functions.total})`);
  console.log(`   Branches:   ${metrics.branches.pct.toFixed(2)}% (${metrics.branches.covered}/${metrics.branches.total})`);
  
  const allAboveThreshold = 
    metrics.lines.pct >= 80 &&
    metrics.statements.pct >= 80 &&
    metrics.functions.pct >= 80 &&
    metrics.branches.pct >= 80;

  if (allAboveThreshold) {
    console.log("\n✅ All metrics meet the 80% threshold!");
  } else {
    console.log("\n⚠️  Some metrics are below the 80% threshold.");
  }

  console.log(`\n📁 View full report: ${path.join(COVERAGE_DIR, "index.html")}`);
  console.log(`📁 View history: ${HISTORY_FILE}`);
  if (fs.existsSync(HISTORY_HTML)) {
    console.log(`📁 View history HTML: ${HISTORY_HTML}`);
  }
}

main();

