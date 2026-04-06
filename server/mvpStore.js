import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_DATA_FILE = join(__dirname, 'data', 'mvps.json')

function dataFile() {
  return process.env.MVPS_DATA_FILE ?? DEFAULT_DATA_FILE
}

export async function readMvps() {
  try {
    const raw = await readFile(dataFile(), 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

export async function writeMvps(mvps) {
  const file = dataFile()
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(mvps, null, 2), 'utf8')
}
