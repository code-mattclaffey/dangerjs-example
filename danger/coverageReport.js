import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

// Rule 2: show coverage for each changed file in the PR (information, never blocks).
// Rule 3: when global coverage is well above a Jest threshold, warn so the developer raises it.

const SOURCE_DIR = 'src/'

// How far above a threshold a metric must be before Danger suggests raising it.
const COVERAGE_THRESHOLD_INCREASE = 5

const IGNORE_FILES = [
  /\.d\.ts$/,
  /\.stories\.(ts|tsx)$/,
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
  /__tests__\//,
  // Icons are SVG markup with no behaviour to test
  /\/icons\//,
  /generated/,
  /node_modules/,
  /\/pages\//,
]

function getCoverageThresholds() {
  // Read the thresholds from the Jest config, so the config stays the single source of truth.
  const require = createRequire(path.join(process.cwd(), 'package.json'))
  return require('./jest.config.cjs').coverageThreshold.global
}

function percentage(covered, total) {
  return total > 0 ? Math.round((covered / total) * 100) : 0
}

function summarise(covered, total) {
  return { total, covered, pct: percentage(covered, total) }
}

// Jest's coverage-final.json holds raw hit counts per statement, function and branch.
// Turn it into the same shape as coverage-summary.json: a pct per metric per file, plus a total.
function convertCoverageFinalToSummary(coverageFinalData) {
  const coverageData = {}

  Object.entries(coverageFinalData).forEach(([filePath, entry]) => {
    const statements = Object.values(entry.s || {})
    const functions = Object.values(entry.f || {})
    const branches = Object.values(entry.b || {}).flat()

    const statementMap = entry.statementMap || {}
    const lineNumbers = new Set(
      Object.values(statementMap)
        .map((s) => s.start?.line)
        .filter(Boolean),
    )
    const linesCovered = new Set()
    Object.entries(entry.s || {}).forEach(([stmtId, count]) => {
      if (count > 0 && statementMap[stmtId]?.start?.line) {
        linesCovered.add(statementMap[stmtId].start.line)
      }
    })

    coverageData[normalisePath(filePath)] = {
      statements: summarise(statements.filter((v) => v > 0).length, statements.length),
      functions: summarise(functions.filter((v) => v > 0).length, functions.length),
      branches: summarise(branches.filter((v) => v > 0).length, branches.length),
      lines: summarise(linesCovered.size, lineNumbers.size),
    }
  })

  if (Object.keys(coverageData).length === 0) {
    return {}
  }

  const metrics = ['statements', 'functions', 'branches', 'lines']
  coverageData.total = Object.fromEntries(
    metrics.map((metric) => {
      const files = Object.values(coverageData)
      const total = files.reduce((sum, file) => sum + file[metric].total, 0)
      const covered = files.reduce((sum, file) => sum + file[metric].covered, 0)
      return [metric, summarise(covered, total)]
    }),
  )

  return coverageData
}

export default function checkCoverageReporting() {
  const coverageFile = path.join(process.cwd(), 'coverage/coverage-final.json')

  if (!fs.existsSync(coverageFile)) {
    return
  }

  try {
    const thresholds = getCoverageThresholds()
    const coverageFinalData = JSON.parse(fs.readFileSync(coverageFile, 'utf-8'))
    const coverageData = convertCoverageFinalToSummary(coverageFinalData)

    if (!coverageData.total) {
      return
    }

    checkChangedFileCoverage(coverageData, thresholds)
    checkGlobalCoverage(coverageData.total, thresholds)
  } catch (error) {
    console.error('Error parsing coverage report:', error)
  }
}

function getChangedSourceFiles() {
  const changedFiles = [...danger.git.modified_files, ...danger.git.created_files]

  return changedFiles.filter(
    (file) =>
      file.startsWith(SOURCE_DIR) && /\.(ts|tsx)$/.test(file) && !IGNORE_FILES.some((pattern) => pattern.test(file)),
  )
}

function checkChangedFileCoverage(coverageData, thresholds) {
  const changedSourceFiles = getChangedSourceFiles()

  if (changedSourceFiles.length === 0) {
    return
  }

  const files = changedSourceFiles.map((file) => {
    const coverage = coverageData[file]

    if (!coverage) {
      return { file, statements: 0, branches: 0, functions: 0, lines: 0, status: '🔴', missing: true }
    }

    const statements = coverage.statements.pct
    const branches = coverage.branches.pct
    const functions = coverage.functions.pct
    const lines = coverage.lines.pct

    const passes =
      statements >= thresholds.statements &&
      branches >= thresholds.branches &&
      functions >= thresholds.functions &&
      lines >= thresholds.lines

    return { file, statements, branches, functions, lines, status: passes ? '🟢' : '🔴', missing: false }
  })

  const tableRows = files
    .map(
      ({ file, statements, branches, functions, lines, status, missing }) =>
        `| ${status} | \`${file}\` | ${statements}% | ${branches}% | ${functions}% | ${lines}% | ${
          missing ? 'No coverage data' : ''
        } |`,
    )
    .join('\n')

  message(`
## 📈 PR File Coverage

| Status | File | Statements | Branches | Functions | Lines | Notes |
|--------|------|-----------:|---------:|----------:|------:|-------|
${tableRows}

### Configured thresholds

| Statements | Branches | Functions | Lines |
|------------|----------|-----------|-------|
| ${thresholds.statements}% | ${thresholds.branches}% | ${thresholds.functions}% | ${thresholds.lines}% |
`)
}

function checkGlobalCoverage(globalCoverage, thresholds) {
  const warnings = Object.entries(thresholds)
    .map(([metric, threshold]) => {
      const coverage = globalCoverage[metric]?.pct

      if (coverage === undefined || coverage <= threshold + COVERAGE_THRESHOLD_INCREASE) {
        return null
      }

      return `- **${metric}**: ${coverage}% (configured threshold: ${threshold}%)`
    })
    .filter(Boolean)

  if (warnings.length === 0) {
    return
  }

  warn(
    `📊 **Global Coverage Improvement**

The following metrics are more than ${COVERAGE_THRESHOLD_INCREASE}% above their configured thresholds:

${warnings.join('\n')}

Consider increasing the Jest coverage thresholds in \`jest.config.cjs\` to reflect the improved coverage.`,
  )
}

function normalisePath(file) {
  const cwd = `${process.cwd()}/`

  return file.replace(cwd, '').replaceAll('\\', '/')
}
