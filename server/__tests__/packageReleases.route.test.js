import { strict as assert } from 'assert'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const tmpDir = await mkdtemp(join(tmpdir(), 'flowpatch-package-releases-'))
process.env.PACKAGE_RELEASES_DATA_FILE = join(tmpDir, 'packageReleases.json')
process.env.NODE_ENV = 'test'

const { default: packageReleaseRoutes } = await import('../routes/packageReleases.js')

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
  const routePath = path === '/' ? path : '/:id'
  const layer = packageReleaseRoutes.stack.find(candidate => (
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
      release: {
        market: 'SG',
        project: 'WISE',
        stage: 'SIT',
        mvp: 'MVP1',
        appVersion: '23.0.0',
        buildNumber: '12345',
        branch: 'release/mvp1',
        packageDate: '2026-04-13T10:00',
        qaOwner: 'QA',
        testFlightScreenshot: 'testflight.png',
        stories: ['ADO#1001 Story tracker', 'ADO#1002 QA guardrail']
      },
      checklist: {
        branchCorrect: true,
        ticketScope: true,
        qaConfirmed: false
      },
      notes: {
        teamsMessage: 'Teams message',
        buildStartMessage: 'Starting build with version 23.0.0.',
        adoComment: 'ADO comment',
        emailSubject: '[SG][WISE] SIT',
        emailBody: 'Email body',
        confluenceRow: '| 2026-04-13 | 12345 |'
      }
    })

    assert.strictEqual(status, 201, 'POST returns 201')
    assert.ok(body.id, 'POST returns id')
    assert.strictEqual(body.release.buildNumber, '12345', 'POST build number')
    assert.strictEqual(body.release.appVersion, '23.0.0', 'POST app version')
    assert.deepStrictEqual(body.release.stories, ['ADO#1001 Story tracker', 'ADO#1002 QA guardrail'], 'POST stories')
    assert.strictEqual(body.checklist.branchCorrect, true, 'POST checklist boolean')
    assert.strictEqual(body.notes.teamsMessage, 'Teams message', 'POST notes')
    createdId = body.id
  }

  {
    const { status } = await callRoute('POST', '/', {
      release: {
        market: 'SG',
        project: 'WISE',
        stage: 'SIT',
        buildNumber: '',
        stories: ['ADO#1001 Story tracker']
      }
    })

    assert.strictEqual(status, 400, 'POST requires build number')
  }

  {
    const { status, body } = await callRoute('PATCH', `/${createdId}`, {
      qaConfirmed: true,
      checklist: {
        branchCorrect: true,
        qaConfirmed: true
      }
    })

    assert.strictEqual(status, 200, 'PATCH returns 200')
    assert.strictEqual(body.qaConfirmed, true, 'PATCH updates qaConfirmed')
    assert.strictEqual(body.checklist.qaConfirmed, true, 'PATCH updates checklist')
  }

  {
    const { status } = await callRoute('PATCH', '/unknown-id', { qaConfirmed: true })
    assert.strictEqual(status, 404, 'PATCH unknown id returns 404')
  }

  {
    const { status } = await callRoute('DELETE', `/${createdId}`)
    assert.strictEqual(status, 204, 'DELETE returns 204')

    const { body: all } = await callRoute('GET', '/')
    assert.ok(!all.find(item => item.id === createdId), 'DELETE removes release')
  }

  console.log('All package release route tests passed')
} finally {
  await rm(tmpDir, { recursive: true, force: true })
}
