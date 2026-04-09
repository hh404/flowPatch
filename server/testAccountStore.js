import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_DATA_FILE = join(__dirname, 'data', 'testAccounts.json')

function dataFile() {
  return process.env.TEST_ACCOUNTS_DATA_FILE ?? DEFAULT_DATA_FILE
}

export async function readTestAccounts() {
  try {
    const raw = await readFile(dataFile(), 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

export async function writeTestAccounts(testAccounts) {
  const file = dataFile()
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(testAccounts, null, 2), 'utf8')
}
