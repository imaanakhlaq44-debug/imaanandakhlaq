import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'
import ssg from '@hono/vite-ssg'

export default defineConfig(({ command }) => {
  if (command === 'build') {
    return {
      plugins: [ssg({ entry: 'src/index.tsx' })]
    }
  }

  return {
    plugins: [
      devServer({
        entry: 'src/index.tsx'
      })
    ]
  }
});
