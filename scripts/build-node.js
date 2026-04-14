import * as esbuild from 'esbuild'

async function build() {
  console.log('Building for Node.js (Hostinger)...')
  
  try {
    await esbuild.build({
      entryPoints: ['src/entry-node.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18', // Common for Hostinger
      outfile: 'dist/server.js',
      format: 'esm',
      external: [
        'sharp', // Sharp is often binary and should be external
        'fsevents',
        'lightningcss'
      ],
      banner: {
        // Fix for __dirname in ESM if needed
        js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
      },
    })
    console.log('Build successful: dist/server.js')
  } catch (err) {
    console.error('Build failed:', err)
    process.exit(1)
  }
}

build()
