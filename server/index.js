import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import taskRoutes from './routes/tasks.js'
import mvpRoutes from './routes/mvps.js'
import storyRoutes from './routes/stories.js'
import testAccountRoutes from './routes/testAccounts.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT ?? 47291
const ENTRY_FILE = fileURLToPath(import.meta.url)

export function createApp() {
  const app = express()

  app.use(cors({ origin: 'http://localhost:47292' }))
  app.use(express.json())
  app.use('/api/tasks', taskRoutes)
  app.use('/api/mvps', mvpRoutes)
  app.use('/api/stories', storyRoutes)
  app.use('/api/test-accounts', testAccountRoutes)

  // Serve built frontend in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = join(__dirname, '../client/dist')
    app.use(express.static(distPath))
    app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')))
  }

  return app
}

const app = createApp()

export function startServer(target = PORT) {
  return app.listen(target, () => {
    if (typeof target === 'string') {
      console.log(`FlowPatch running on socket ${target}`)
      return
    }

    console.log(`FlowPatch running on http://localhost:${target}`)
  })
}

if (process.argv[1] === ENTRY_FILE) {
  startServer()
}

export default app
