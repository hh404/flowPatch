import { strict as assert } from 'assert'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const tmpDir = await mkdtemp(join(tmpdir(), 'flowpatch-mvps-'))
process.env.MVPS_DATA_FILE = join(tmpDir, 'mvps.json')
process.env.NODE_ENV = 'test'

const { default: mvpRoutes } = await import('../routes/mvps.js')

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
  const routePath = path === '/' || path === '/open-outlook' ? path : '/:name'
  const layer = mvpRoutes.stack.find(candidate => (
    candidate.route?.path === routePath && candidate.route.methods[normalizedMethod]
  ))

  if (!layer) {
    throw new Error(`Handler not found for ${method} ${path}`)
  }

  const params = routePath === '/:name' ? { name: decodeURIComponent(path.slice(1)) } : {}
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

  {
    const { status, body } = await callRoute('POST', '/', {
      name: 'Core Platform MVP',
      folder: '/Users/hans/workspaces/core-platform'
    })

    assert.strictEqual(status, 201, 'POST returns 201 for create')
    assert.strictEqual(body.name, 'Core Platform MVP', 'POST stores name')
    assert.strictEqual(body.folder, '/Users/hans/workspaces/core-platform', 'POST stores folder')
    assert.deepStrictEqual(body.shortcuts, [], 'POST defaults shortcuts')
  }

  {
    const { status, body } = await callRoute('POST', '/', {
      name: 'Core Platform MVP',
      folder: '/Users/hans/workspaces/core-platform-v2',
      shortcuts: [
        {
          label: 'Mailing List',
          title: 'mvp3 package notification'
        }
      ]
    })

    assert.strictEqual(status, 200, 'POST returns 200 for update')
    assert.strictEqual(body.folder, '/Users/hans/workspaces/core-platform-v2', 'POST updates folder')
    assert.strictEqual(body.shortcuts.length, 1, 'POST stores shortcuts')
    assert.ok(body.shortcuts[0].id, 'POST creates shortcut ids')
    assert.strictEqual(body.shortcuts[0].label, 'Mailing List', 'POST stores shortcut label')
    assert.strictEqual(body.shortcuts[0].title, 'mvp3 package notification', 'POST stores shortcut title')
  }

  {
    const { status, body } = await callRoute('GET', '/')
    assert.strictEqual(status, 200, 'GET after create returns 200')
    assert.strictEqual(body.length, 1, 'GET returns one saved MVP')
    assert.strictEqual(body[0].name, 'Core Platform MVP', 'GET returns saved name')
    assert.strictEqual(body[0].folder, '/Users/hans/workspaces/core-platform-v2', 'GET returns saved folder')
    assert.strictEqual(body[0].shortcuts.length, 1, 'GET returns saved shortcuts')
  }

  {
    const { status } = await callRoute('POST', '/', {
      name: 'Broken MVP',
      folder: ''
    })

    assert.strictEqual(status, 400, 'POST without folder returns 400')
  }

  {
    const { status, body } = await callRoute('POST', '/', {
      name: 'Mail MVP',
      shortcuts: [
        {
          label: 'Package Notice',
          title: 'mvp2 package notice'
        }
      ]
    })

    assert.strictEqual(status, 201, 'POST allows shortcuts-only MVP configs')
    assert.strictEqual(body.folder, '', 'POST stores empty folder when only shortcuts exist')
    assert.strictEqual(body.shortcuts[0].label, 'Package Notice', 'POST stores shortcuts-only labels')
  }

  {
    const { status, body } = await callRoute('POST', '/open-outlook', {
      title: 'mvp3 package notification'
    })

    assert.strictEqual(status, 200, 'open-outlook returns 200')
    assert.strictEqual(body.title, 'mvp3 package notification', 'open-outlook returns copied title')
    assert.strictEqual(body.action, 'open-outlook', 'open-outlook returns action')
  }

  {
    const { status } = await callRoute('DELETE', `/${encodeURIComponent('Core Platform MVP')}`)
    assert.strictEqual(status, 204, 'DELETE returns 204')
  }

  {
    const { status } = await callRoute('DELETE', `/${encodeURIComponent('Missing MVP')}`)
    assert.strictEqual(status, 404, 'DELETE returns 404 for missing MVP')
  }

  console.log('All MVP route tests passed')
} finally {
  await rm(tmpDir, { recursive: true, force: true })
}
