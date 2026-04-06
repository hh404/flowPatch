import { strict as assert } from 'assert'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const tmpDir = await mkdtemp(join(tmpdir(), 'flowpatch-stories-'))
process.env.STORIES_DATA_FILE = join(tmpDir, 'stories.json')
process.env.NODE_ENV = 'test'
process.env.TEST_SELECTED_FOLDER = join(tmpDir, 'picked-folder')

const { default: storyRoutes } = await import('../routes/stories.js')

function createResponse() {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      response.statusCode = code
      return response
    },
    json(payload) {
      response.body = payload
      return response
    },
    end() {
      return response
    }
  }

  return response
}

function getHandler(method, path) {
  const normalizedMethod = method.toLowerCase()
  const routePath = path === '/' || path === '/open-local' || path === '/select-local-folder' ? path : '/:id'
  const layer = storyRoutes.stack.find(candidate => (
    candidate.route?.path === routePath && candidate.route.methods[normalizedMethod]
  ))

  if (!layer) {
    throw new Error(`Handler not found for ${method} ${path}`)
  }

  const params = routePath === '/:id' ? { id: path.slice(1) } : {}
  const handler = layer.route.stack.at(-1).handle
  return { handler, params }
}

async function callRoute(method, path, body = {}) {
  const { handler, params } = getHandler(method, path)
  const req = { body, params }
  const res = createResponse()

  await handler(req, res)
  return { status: res.statusCode, body: res.body }
}

try {
  {
    const { status, body } = await callRoute('GET', '/')
    assert.strictEqual(status, 200, 'GET returns 200')
    assert.deepStrictEqual(body, [], 'GET returns empty array initially')
  }

  let createdId

  {
    const { status, body } = await callRoute('POST', '/', {
      mvp: 'Core Platform MVP',
      title: 'FlowPatch MVP shell',
      link: 'https://dev.azure.com/example/story-1',
      folder: join(tmpDir, 'core-platform-mvp', 'flowpatch-mvp-shell'),
      description: 'Half-baked state with [mockup](/tmp/mockup.html)',
      status: 'In Progress'
    })

    assert.strictEqual(status, 201, 'POST returns 201')
    assert.ok(body.id, 'POST returns id')
    assert.strictEqual(body.mvp, 'Core Platform MVP', 'POST mvp')
    assert.strictEqual(body.title, 'FlowPatch MVP shell', 'POST title')
    assert.strictEqual(body.link, 'https://dev.azure.com/example/story-1', 'POST link')
    assert.strictEqual(body.folder, join(tmpDir, 'core-platform-mvp', 'flowpatch-mvp-shell'), 'POST folder')
    assert.strictEqual(body.description, 'Half-baked state with [mockup](/tmp/mockup.html)', 'POST description')
    assert.strictEqual(body.status, 'In Progress', 'POST status')
    createdId = body.id
  }

  {
    const { status } = await callRoute('POST', '/', {
      mvp: 'Core Platform MVP',
      title: 'Broken story',
      link: '',
      status: 'Planned'
    })

    assert.strictEqual(status, 400, 'POST requires title/link/status')
  }

  {
    const { status, body } = await callRoute('PATCH', `/${createdId}`, {
      mvp: 'Search MVP',
      status: 'Blocked',
      link: 'https://dev.azure.com/example/story-1-updated',
      folder: join(tmpDir, 'search-mvp', 'flowpatch-mvp-shell'),
      description: 'Moved, but local notes still exist'
    })

    assert.strictEqual(status, 200, 'PATCH returns 200')
    assert.strictEqual(body.mvp, 'Search MVP', 'PATCH updates mvp')
    assert.strictEqual(body.status, 'Blocked', 'PATCH updates status')
    assert.strictEqual(body.link, 'https://dev.azure.com/example/story-1-updated', 'PATCH updates link')
    assert.strictEqual(body.folder, join(tmpDir, 'search-mvp', 'flowpatch-mvp-shell'), 'PATCH updates folder')
    assert.strictEqual(body.description, 'Moved, but local notes still exist', 'PATCH updates description')
  }

  {
    const { status } = await callRoute('PATCH', '/unknown-id', { status: 'Done' })
    assert.strictEqual(status, 404, 'PATCH unknown id returns 404')
  }

  {
    const { body: created } = await callRoute('POST', '/', {
      mvp: 'Current MVP',
      title: 'Whitelist story',
      link: 'https://dev.azure.com/example/story-2',
      status: 'Planned'
    })

    const originalId = created.id
    const originalCreatedAt = created.createdAt
    const { status, body } = await callRoute('PATCH', `/${originalId}`, {
      id: 'hacked-id',
      createdAt: '1970-01-01T00:00:00.000Z',
      mvp: 'Release MVP',
      folder: join(tmpDir, 'release-mvp', 'whitelist-story'),
      description: 'Ship it',
      status: 'Done'
    })

    assert.strictEqual(status, 200, 'PATCH returns 200 for whitelist test')
    assert.strictEqual(body.id, originalId, 'PATCH ignores id')
    assert.strictEqual(body.createdAt, originalCreatedAt, 'PATCH ignores createdAt')
    assert.strictEqual(body.mvp, 'Release MVP', 'PATCH updates allowed mvp field')
    assert.strictEqual(body.folder, join(tmpDir, 'release-mvp', 'whitelist-story'), 'PATCH updates allowed folder field')
    assert.strictEqual(body.description, 'Ship it', 'PATCH updates allowed description field')
    assert.strictEqual(body.status, 'Done', 'PATCH updates allowed fields')
  }

  {
    const { status, body } = await callRoute('POST', '/', {
      title: 'Legacy story',
      link: 'https://dev.azure.com/example/story-3',
      status: 'New'
    })

    assert.strictEqual(status, 201, 'POST without mvp returns 201')
    assert.strictEqual(body.mvp, 'Current MVP', 'POST defaults mvp')
  }

  {
    const localFile = join(tmpDir, 'prototype.html')
    await writeFile(localFile, '<html></html>', 'utf8')

    const { status, body } = await callRoute('POST', '/open-local', {
      path: localFile,
      action: 'reveal'
    })

    assert.strictEqual(status, 200, 'open-local returns 200 for valid local file')
    assert.strictEqual(body.resolvedPath, localFile, 'open-local resolves local path')
    assert.strictEqual(body.action, 'reveal', 'open-local preserves action')
  }

  {
    const { status } = await callRoute('POST', '/open-local', {
      path: 'https://dev.azure.com/example/story-4',
      action: 'open'
    })

    assert.strictEqual(status, 400, 'open-local rejects remote urls')
  }

  {
    const { status } = await callRoute('POST', '/open-local', {
      path: join(tmpDir, 'missing.html'),
      action: 'open'
    })

    assert.strictEqual(status, 404, 'open-local returns 404 for missing path')
  }

  {
    const { status, body } = await callRoute('POST', '/select-local-folder', {
      currentPath: join(tmpDir, 'search-mvp')
    })

    assert.strictEqual(status, 200, 'select-local-folder returns 200')
    assert.strictEqual(body.path, join(tmpDir, 'picked-folder'), 'select-local-folder returns selected folder')
  }

  {
    const { status } = await callRoute('DELETE', `/${createdId}`)
    assert.strictEqual(status, 204, 'DELETE returns 204')

    const { body: all } = await callRoute('GET', '/')
    assert.ok(!all.find(story => story.id === createdId), 'DELETE removes story')
  }

  {
    const { status } = await callRoute('DELETE', '/unknown-id')
    assert.strictEqual(status, 404, 'DELETE unknown id returns 404')
  }

  console.log('All story route tests passed')
} finally {
  await rm(tmpDir, { recursive: true, force: true })
}
