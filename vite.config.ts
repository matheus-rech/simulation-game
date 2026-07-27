import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sites } from './build/sites-vite-plugin'

function splitVendorChunk(moduleId: string): string | undefined {
  if (!moduleId.includes('node_modules')) return undefined

  const normalizedId = moduleId.replaceAll('\\', '/')

  if (
    normalizedId.includes('/react/') ||
    normalizedId.includes('/react-dom/') ||
    normalizedId.includes('/scheduler/')
  ) {
    return 'react-vendor'
  }

  if (
    normalizedId.includes('/@react-three/rapier/') ||
    normalizedId.includes('/@dimforge/')
  ) {
    return 'physics-vendor'
  }

  if (
    normalizedId.includes('/@react-three/postprocessing/') ||
    normalizedId.includes('/postprocessing/')
  ) {
    return 'postprocessing-vendor'
  }

  if (
    normalizedId.includes('/@react-three/drei/') ||
    normalizedId.includes('/three-stdlib/')
  ) {
    return 'drei-vendor'
  }

  if (normalizedId.includes('/@react-three/fiber/')) {
    return 'r3f-vendor'
  }

  if (
    normalizedId.includes('/three/') ||
    normalizedId.includes('/three-bvh-csg/')
  ) {
    return 'three-vendor'
  }

  if (
    normalizedId.includes('/@anthropic-ai/') ||
    normalizedId.includes('/@google/generative-ai/')
  ) {
    return 'ai-vendor'
  }

  return undefined
}

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [
    react(),
    ...(process.env.SITES_BUILD === 'true' ? [sites()] : []),
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.GENERATE_SOURCEMAP !== 'false',
    chunkSizeWarningLimit: 1_000,
    rollupOptions: {
      output: {
        manualChunks: splitVendorChunk,
      },
    },
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing']
  }
})
