import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import taskRoutes from './routes/tasks.js'

const app = express()
const PORT = process.env.PORT ?? 3001
const __dirname = dirname(fileURLToPath(import.meta.url))

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use('/api/tasks', taskRoutes)

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../client/dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')))
}

app.listen(PORT, () => console.log(`FlowPatch running on http://localhost:${PORT}`))

export default app
