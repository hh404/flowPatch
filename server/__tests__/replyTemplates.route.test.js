import { strict as assert } from 'assert'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const tmpDir = await mkdtemp(join(tmpdir(), 'flowpatch-reply-templates-'))
process.env.REPLY_TEMPLATES_DATA_FILE = join(tmpDir, 'replyTemplates.json')
process.env.NODE_ENV = 'test'

const { default: replyTemplateRoutes } = await import('../routes/replyTemplates.js')

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
  let routePath = path
  let params = {}

  if (/^\/categories\/[^/]+$/.test(path)) {
    routePath = '/categories/:id'
    params = { id: path.split('/')[2] }
  } else if (/^\/categories\/[^/]+\/replies$/.test(path)) {
    routePath = '/categories/:id/replies'
    params = { id: path.split('/')[2] }
  } else if (/^\/categories\/[^/]+\/replies\/[^/]+$/.test(path)) {
    routePath = '/categories/:categoryId/replies/:replyId'
    params = {
      categoryId: path.split('/')[2],
      replyId: path.split('/')[4]
    }
  }

  const layer = replyTemplateRoutes.stack.find(candidate => (
    candidate.route?.path === routePath && candidate.route.methods[normalizedMethod]
  ))

  if (!layer) {
    throw new Error(`Handler not found for ${method} ${path}`)
  }

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
    assert.deepStrictEqual(body, { categories: [] }, 'GET returns empty document initially')
  }

  {
    const { status, body } = await callRoute('POST', '/categories', {
      id: 'release',
      name: 'Release / Build',
      icon: '🚀'
    })

    assert.strictEqual(status, 201, 'create category returns 201')
    assert.strictEqual(body.id, 'release', 'create category id')
    assert.strictEqual(body.name, 'Release / Build', 'create category name')
    assert.strictEqual(body.icon, '🚀', 'create category icon')
    assert.deepStrictEqual(body.replies, [], 'create category replies empty')
  }

  {
    const { status } = await callRoute('POST', '/categories', {
      id: 'release',
      name: 'Duplicate category'
    })

    assert.strictEqual(status, 409, 'duplicate category id returns 409')
  }

  {
    const { status, body } = await callRoute('PATCH', '/categories/release', {
      id: 'release-updated',
      name: 'Release Timeline',
      icon: '🛰️'
    })

    assert.strictEqual(status, 200, 'update category returns 200')
    assert.strictEqual(body.id, 'release-updated', 'update category id')
    assert.strictEqual(body.name, 'Release Timeline', 'update category name')
    assert.strictEqual(body.icon, '🛰️', 'update category icon')
  }

  {
    const { status, body } = await callRoute('POST', '/categories/release-updated/replies', {
      id: 'release-timeline',
      title: 'Release timeline explanation',
      keywords: ['timeline', 'review', 'timeline', '  app store '],
      polite: 'After code freeze, we still need time for QA and review.',
      firm: 'The release timeline has already been shared and will not be shortened.'
    })

    assert.strictEqual(status, 201, 'create reply returns 201')
    assert.strictEqual(body.id, 'release-timeline', 'create reply id')
    assert.deepStrictEqual(body.keywords, ['timeline', 'review', 'app store'], 'create reply normalizes keywords')
    assert.strictEqual(body.polite, 'After code freeze, we still need time for QA and review.', 'create reply polite text')
    assert.strictEqual(body.firm, 'The release timeline has already been shared and will not be shortened.', 'create reply firm text')
  }

  {
    const { status, body } = await callRoute('PATCH', '/categories/release-updated/replies/release-timeline', {
      id: 'release-window',
      title: 'Release window',
      keywords: ['window', 'submission'],
      polite: 'We can only control when we submit.',
      firm: 'We do not control Apple review speed after submission.'
    })

    assert.strictEqual(status, 200, 'update reply returns 200')
    assert.strictEqual(body.id, 'release-window', 'update reply id')
    assert.strictEqual(body.title, 'Release window', 'update reply title')
    assert.deepStrictEqual(body.keywords, ['window', 'submission'], 'update reply keywords')
    assert.strictEqual(body.polite, 'We can only control when we submit.', 'update reply polite text')
    assert.strictEqual(body.firm, 'We do not control Apple review speed after submission.', 'update reply firm text')
  }

  {
    const { status } = await callRoute('DELETE', '/categories/release-updated/replies/release-window')
    assert.strictEqual(status, 204, 'delete reply returns 204')
  }

  {
    const { status } = await callRoute('DELETE', '/categories/release-updated')
    assert.strictEqual(status, 204, 'delete category returns 204')
  }

  {
    const { status, body } = await callRoute('GET', '/')
    assert.strictEqual(status, 200, 'GET after mutations returns 200')
    assert.deepStrictEqual(body, { categories: [] }, 'document is empty after deletions')
  }

  console.log('All reply template route tests passed')
} finally {
  await rm(tmpDir, { recursive: true, force: true })
}
