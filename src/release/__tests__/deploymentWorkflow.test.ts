import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/deploy-game.yml'),
  'utf8'
)

describe('GitHub Pages deployment workflow', () => {
  it('runs every local release gate before building', () => {
    expect(workflow).toContain('run: npm run type-check')
    expect(workflow).toContain('run: npm run lint')
    expect(workflow).toContain('run: npm test -- --run')
    expect(workflow).toContain('run: npm run verify:deployment')
  })

  it('builds for the repository Pages subpath and deploys the artifact', () => {
    expect(workflow).toContain('VITE_BASE_PATH: /simulation-game/')
    expect(workflow).toContain('uses: actions/upload-pages-artifact@')
    expect(workflow).toContain('uses: actions/deploy-pages@')
  })

  it('supports both default-branch and manual releases', () => {
    expect(workflow).toMatch(/branches:\s*\n\s+- meta/)
    expect(workflow).toContain('workflow_dispatch:')
  })
})
