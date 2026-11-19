import fs from 'node:fs'

// Rule 1: every changed source file needs a test file. Fails the build.

// Only files under this folder are checked. In a monorepo this might be 'apps/web/src/'.
const SOURCE_DIR = 'src/'

const WHITELIST_FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx']

// Every ignore rule carries a reason, so exceptions stay rare and reviewable.
const IGNORE_PATTERNS = [
  // Type declarations have no runtime behaviour
  (file) => file.endsWith('.d.ts'),
  (file) => file.includes('types.ts'),
  // Storybook stories are documentation, not behaviour
  (file) => file.includes('.stories.'),
  // Test files and test helpers are the tests themselves
  (file) => file.includes('.test.'),
  (file) => file.includes('__tests__'),
  (file) => file.includes('/test-utils/'),
  (file) => file.includes('/mocks/'),
  (file) => file.includes('/__mocks__/'),
  // Generated code is rebuilt by a tool, so testing it tests the tool
  (file) => file.includes('/generated/'),
  // Icons are SVG markup with no behaviour to test
  (file) => file.includes('/icons/'),
  // Framework route files are covered by end-to-end tests
  (file) => file.includes('/pages/'),
  (file) => file.includes('node_modules'),
]

export default function checkForTestFiles() {
  // Escape hatch: #skip-danger in the PR description skips the checks, and it shows in the review.
  const prBody = (danger.github?.pr?.body || '').toLowerCase()
  if (prBody.includes('#skip-danger')) {
    return message('⏭️ Danger JS checks skipped via PR description comment.')
  }

  const changedFiles = [...danger.git.modified_files, ...danger.git.created_files]

  const filesToCheck = changedFiles.filter((file) => {
    if (!file.startsWith(SOURCE_DIR)) return false

    if (!WHITELIST_FILE_EXTENSIONS.some((ext) => file.endsWith(ext))) {
      return false
    }

    return !IGNORE_PATTERNS.some((pattern) => pattern(file))
  })

  const filesWithoutTests = filesToCheck.filter((file) => {
    const dir = file.substring(0, file.lastIndexOf('/'))
    const fileName = file.substring(file.lastIndexOf('/') + 1)
    const baseFileName = fileName.replace(/\.(js|jsx|ts|tsx)$/, '')

    // A module's test does not have to share its extension: a hook in a .ts file is routinely
    // tested from a .test.tsx, because the render wrapper needs JSX. Both spellings count, in the
    // co-located and __tests__ positions alike.
    const testExtensions = /\.tsx?$/.test(file) ? ['ts', 'tsx'] : ['js', 'jsx']
    const testPatterns = testExtensions.flatMap((extension) => [
      `${dir}/${baseFileName}.test.${extension}`,
      `${dir}/__tests__/${baseFileName}.test.${extension}`,
    ])

    // The test is part of this PR
    if (testPatterns.some((testFile) => changedFiles.includes(testFile))) {
      return false
    }

    // The test already exists in the repo
    return !testPatterns.some((testFile) => fs.existsSync(testFile))
  })

  if (filesWithoutTests.length > 0) {
    const fileList = filesWithoutTests.map((file) => `- \`${file}\``).join('\n')

    fail(`Missing tests for the following files:\n${fileList}\n\n` + 'Please add a matching `.test` file.')
  } else if (filesToCheck.length > 0) {
    message('✅ All modified source files have corresponding test files.')
  }
}
