import { access, cp, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

export function sites(): Plugin {
  let root = process.cwd()

  return {
    name: 'sites',
    apply: 'build',
    configResolved(config) {
      root = config.root
    },
    async closeBundle() {
      const hostingConfig = resolve(root, '.openai', 'hosting.json')
      const workerSource = resolve(root, 'worker', 'sites-static-worker.js')
      const metadataDirectory = resolve(root, 'dist', '.openai')
      const workerDirectory = resolve(root, 'dist', 'server')

      if (!(await exists(hostingConfig))) {
        throw new Error('Sites build requires .openai/hosting.json')
      }
      if (!(await exists(workerSource))) {
        throw new Error('Sites build requires worker/sites-static-worker.js')
      }

      await rm(metadataDirectory, { recursive: true, force: true })
      await mkdir(metadataDirectory, { recursive: true })
      await mkdir(workerDirectory, { recursive: true })
      await cp(hostingConfig, resolve(metadataDirectory, 'hosting.json'))
      await cp(workerSource, resolve(workerDirectory, 'index.js'))
    },
  }
}
