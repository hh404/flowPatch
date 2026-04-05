import { strict as assert } from 'assert'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const tmpDir = await mkdtemp(join(tmpdir(), 'flowpatch-'))
process.env.DATA_FILE = join(tmpDir, 'tasks.json')

const { readTasks, writeTasks } = await import('../store.js')

{
  const tasks = await readTasks()
  assert.deepStrictEqual(tasks, [], 'readTasks returns [] when file missing')
}

{
  const tasks = [{ id: '1', title: 'Test', type: 'todo', status: 'pending' }]
  await writeTasks(tasks)
  const result = await readTasks()
  assert.deepStrictEqual(result, tasks, 'writeTasks persists and readTasks retrieves')
}

{
  await writeTasks([{ id: '1', title: 'Old' }])
  await writeTasks([{ id: '2', title: 'New' }])
  const result = await readTasks()
  assert.strictEqual(result.length, 1, 'writeTasks overwrites: correct length')
  assert.strictEqual(result[0].title, 'New', 'writeTasks overwrites: correct content')
}

await rm(tmpDir, { recursive: true })
console.log('All store tests passed')
