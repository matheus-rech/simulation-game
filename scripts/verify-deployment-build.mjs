import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = join(repositoryRoot, 'dist')
const indexPath = join(distDirectory, 'index.html')
const expectedBasePath = process.env.DEPLOY_BASE_PATH ?? '/simulation-game/'
const requireSitesWorker = process.env.REQUIRE_SITES_WORKER === 'true'
const maximumChunkBytes = 1_000_000

const expectedTextures = [
  'cavernous-sinus_standard.png',
  'dura_standard.png',
  'ica_standard.png',
  'mwcs_standard.png',
  'nasal-septum_standard.png',
  'nasal-turbinate_standard.png',
  'optic-nerve_standard.png',
  'pituitary-adenoma_knosp-2.png',
  'pseudocapsule_standard.png',
  'sella-floor_standard.png',
  'sphenoid-ostium_standard.png',
  'sphenoid-sinus_standard.png',
]

function walk(directory) {
  if (!existsSync(directory)) return []

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

const failures = []

if (requireSitesWorker) {
  const workerPath = join(distDirectory, 'server', 'index.js')
  const hostingPath = join(distDirectory, '.openai', 'hosting.json')

  if (!existsSync(workerPath)) failures.push('Sites worker entry is missing')
  if (!existsSync(hostingPath)) failures.push('Sites hosting metadata is missing')
}

if (!existsSync(indexPath)) {
  failures.push('dist/index.html is missing')
} else {
  const html = readFileSync(indexPath, 'utf8')
  const resourceUrls = [
    ...html.matchAll(/(?:href|src)="([^"]+)"/g),
  ].map((match) => match[1])

  const deployableUrls = resourceUrls.filter(
    (url) => !url.startsWith('data:') && !url.startsWith('http')
  )

  if (!deployableUrls.some((url) => url.startsWith(expectedBasePath))) {
    failures.push(`index.html has no asset under ${expectedBasePath}`)
  }

  const invalidRootUrls = deployableUrls.filter(
    (url) => url.startsWith('/') && !url.startsWith(expectedBasePath)
  )

  if (invalidRootUrls.length > 0) {
    failures.push(`index.html contains invalid root URLs: ${invalidRootUrls.join(', ')}`)
  }
}

const files = walk(distDirectory)
const javascriptChunks = files.filter((path) => path.endsWith('.js'))
const sourceMaps = files.filter((path) => path.endsWith('.map'))
const oversizedChunks = javascriptChunks.filter(
  (path) => statSync(path).size > maximumChunkBytes
)

if (javascriptChunks.length < 4) {
  failures.push(
    `expected at least 4 JavaScript chunks, found ${javascriptChunks.length}`
  )
}

if (oversizedChunks.length > 0) {
  failures.push(
    `JavaScript chunks exceed ${maximumChunkBytes} bytes: ${oversizedChunks
      .map((path) => relative(distDirectory, path))
      .join(', ')}`
  )
}

if (sourceMaps.length > 0) {
  failures.push(`source maps are present: ${sourceMaps.join(', ')}`)
}

for (const texture of expectedTextures) {
  const texturePath = join(distDirectory, 'textures', 'anatomy', texture)
  if (!existsSync(texturePath)) {
    failures.push(`missing anatomy texture: ${texture}`)
  }
}

if (failures.length > 0) {
  console.error('Deployment build verification failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

const largestChunkBytes = Math.max(
  ...javascriptChunks.map((path) => statSync(path).size)
)

console.log(
  JSON.stringify(
    {
      basePath: expectedBasePath,
      javascriptChunks: javascriptChunks.length,
      largestChunkBytes,
      sourceMaps: sourceMaps.length,
      textures: expectedTextures.length,
    },
    null,
    2
  )
)
