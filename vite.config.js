import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Two extra build modes beyond the default:
//  - "preview": a single self-contained HTML file using hash routing,
//    for a live demo (Claude Artifact) that can't rely on server rewrites.
//  - the default client build is what actually deploys to Vercel, paired
//    with the SSR build + prerender.mjs for real static routes and SEO.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'preview' ? [viteSingleFile()] : [])],
  define: {
    __ROUTER_MODE__: JSON.stringify(mode === 'preview' ? 'hash' : 'browser'),
  },
  build: {
    outDir: mode === 'preview' ? 'dist-preview' : 'dist',
    assetsInlineLimit: mode === 'preview' ? 100000000 : 4096,
  },
}))
