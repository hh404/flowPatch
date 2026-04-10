import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_DATA_FILE = join(__dirname, 'data', 'replyTemplates.json')

function dataFile() {
  return process.env.REPLY_TEMPLATES_DATA_FILE ?? DEFAULT_DATA_FILE
}

export async function readReplyTemplates() {
  try {
    const raw = await readFile(dataFile(), 'utf8')
    return JSON.parse(raw)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { categories: [] }
    }

    throw error
  }
}

export async function writeReplyTemplates(replyTemplates) {
  const file = dataFile()
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(replyTemplates, null, 2), 'utf8')
}
