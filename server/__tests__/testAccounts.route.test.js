import { strict as assert } from 'assert'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const tmpDir = await mkdtemp(join(tmpdir(), 'flowpatch-test-accounts-'))
process.env.TEST_ACCOUNTS_DATA_FILE = join(tmpDir, 'testAccounts.json')
process.env.NODE_ENV = 'test'

const { default: testAccountRoutes } = await import('../routes/testAccounts.js')

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
  const routePath = path === '/' ? '/' : '/:id'
  const layer = testAccountRoutes.stack.find(candidate => (
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
      env: 'staging',
      account: 'qa.flowpatch@example.com',
      password: 'Secret123!',
      note: 'Use for smoke tests',
      simulator: 'iPhone 16 Pro',
      usedBy: 'Hans',
      bankId: 'bankid-001'
    })

    assert.strictEqual(status, 201, 'POST returns 201')
    assert.ok(body.id, 'POST returns id')
    assert.strictEqual(body.env, 'staging', 'POST env')
    assert.strictEqual(body.account, 'qa.flowpatch@example.com', 'POST account')
    assert.strictEqual(body.password, 'Secret123!', 'POST password')
    assert.strictEqual(body.note, 'Use for smoke tests', 'POST note')
    assert.strictEqual(body.simulator, 'iPhone 16 Pro', 'POST simulator')
    assert.strictEqual(body.usedBy, 'Hans', 'POST usedBy')
    assert.strictEqual(body.bankId, 'bankid-001', 'POST bankId')
    createdId = body.id
  }

  {
    const { status } = await callRoute('POST', '/', {
      env: 'staging',
      account: '',
      password: 'Secret123!',
      note: 'Missing account'
    })

    assert.strictEqual(status, 400, 'POST requires env/account/password')
  }

  {
    const { status, body } = await callRoute('POST', '/', {
      env: 'qa',
      account: 'qa-no-note@example.com',
      password: 'NoNote123!'
    })

    assert.strictEqual(status, 201, 'POST allows empty note')
    assert.strictEqual(body.note, '', 'POST normalizes missing note to empty string')
  }

  {
    const { status, body } = await callRoute('PATCH', `/${createdId}`, {
      env: 'prod',
      password: 'Updated123!',
      note: '',
      simulator: '',
      usedBy: '',
      bankId: ''
    })

    assert.strictEqual(status, 200, 'PATCH returns 200')
    assert.strictEqual(body.env, 'prod', 'PATCH updates env')
    assert.strictEqual(body.password, 'Updated123!', 'PATCH updates password')
    assert.strictEqual(body.note, '', 'PATCH allows clearing note')
    assert.strictEqual(body.simulator, '', 'PATCH clears simulator')
    assert.strictEqual(body.usedBy, '', 'PATCH clears usedBy')
    assert.strictEqual(body.bankId, '', 'PATCH clears bankId')
  }

  {
    const { status } = await callRoute('PATCH', '/unknown-id', { env: 'dev' })
    assert.strictEqual(status, 404, 'PATCH unknown id returns 404')
  }

  {
    const { body: created } = await callRoute('POST', '/', {
      env: 'dev',
      account: 'dev.flowpatch@example.com',
      password: 'Dev123!',
      note: 'Dev sandbox'
    })

    const originalId = created.id
    const originalCreatedAt = created.createdAt
    const { status, body } = await callRoute('PATCH', `/${originalId}`, {
      id: 'hacked-id',
      createdAt: '1970-01-01T00:00:00.000Z',
      env: 'qa',
      account: 'qa.flowpatch@example.com',
      note: 'QA sandbox'
    })

    assert.strictEqual(status, 200, 'PATCH whitelist returns 200')
    assert.strictEqual(body.id, originalId, 'PATCH ignores id')
    assert.strictEqual(body.createdAt, originalCreatedAt, 'PATCH ignores createdAt')
    assert.strictEqual(body.env, 'qa', 'PATCH updates env')
    assert.strictEqual(body.account, 'qa.flowpatch@example.com', 'PATCH updates account')
    assert.strictEqual(body.note, 'QA sandbox', 'PATCH updates note')
  }

  {
    const { status } = await callRoute('DELETE', `/${createdId}`)
    assert.strictEqual(status, 204, 'DELETE returns 204')

    const { body: all } = await callRoute('GET', '/')
    assert.ok(!all.find(item => item.id === createdId), 'DELETE removes item')
  }

  {
    const { status } = await callRoute('DELETE', '/unknown-id')
    assert.strictEqual(status, 404, 'DELETE unknown id returns 404')
  }

  console.log('All test account route tests passed')
} finally {
  await rm(tmpDir, { recursive: true, force: true })
}
