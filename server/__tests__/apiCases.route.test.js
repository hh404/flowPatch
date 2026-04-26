import { strict as assert } from 'assert'
import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const tmpDir = await mkdtemp(join(tmpdir(), 'flowpatch-api-cases-'))
process.env.API_CASES_ROOT_DIR = join(tmpDir, 'api-cases')
process.env.NODE_ENV = 'test'

const { default: apiCaseRoutes } = await import('../routes/apiCases.js')

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
    }
  }

  return response
}

function getHandler(method, path) {
  const normalizedMethod = method.toLowerCase()
  const layer = apiCaseRoutes.stack.find(candidate => (
    candidate.route?.path === path && candidate.route.methods[normalizedMethod]
  ))

  if (!layer) {
    throw new Error(`Handler not found for ${method} ${path}`)
  }

  return layer.route.stack.at(-1).handle
}

async function callRoute(method, path, body = {}) {
  const handler = getHandler(method, path)
  const req = { body, params: {} }
  const res = createResponse()

  await handler(req, res)
  return { status: res.statusCode, body: res.body }
}

try {
  const apiFolder = join(process.env.API_CASES_ROOT_DIR, 'AuthLogin')
  await mkdir(apiFolder, { recursive: true })

  await writeFile(join(apiFolder, '_index.json'), JSON.stringify({
    id: 'auth-login',
    name: 'Auth Login',
    method: 'POST',
    path: '/api/v1/auth/login',
    cases: {
      'INFT.login.device.faceid.risk': {
        name: 'INFT FaceID Risk',
        desc: 'FaceID login under risk policy branch.',
        bau: '20260404122322',
        current: '20260407153010'
      }
    }
  }), 'utf8')

  await writeFile(join(apiFolder, 'request--INFT.login.device.faceid.risk--20260404122322.json'), JSON.stringify({
    username: 'qa.user@example.com',
    password: 'P@ssw0rd!'
  }), 'utf8')

  await writeFile(join(apiFolder, 'response--INFT.login.device.faceid.risk--20260404122322.json'), JSON.stringify({
    code: '0',
    message: 'success-bau'
  }), 'utf8')

  await writeFile(join(apiFolder, 'request--INFT.login.device.faceid.risk--20260407153010.json'), JSON.stringify({
    username: 'qa.user@example.com',
    password: 'P@ssw0rd!',
    deviceTrust: 'unknown'
  }), 'utf8')

  await writeFile(join(apiFolder, 'response--INFT.login.device.faceid.risk--20260407153010.json'), JSON.stringify({
    code: '0',
    message: 'success-current'
  }), 'utf8')

  const { status, body } = await callRoute('GET', '/')

  assert.strictEqual(status, 200, 'GET returns 200')
  assert.strictEqual(body.length, 1, 'GET returns one interface')
  assert.strictEqual(body[0].cases.length, 1, 'GET returns one case')
  assert.strictEqual(body[0].cases[0].bauVersion, '20260404122322', 'case has BAU version')
  assert.strictEqual(body[0].cases[0].currentVersion, '20260407153010', 'case has current version')
  assert.strictEqual(body[0].cases[0].versions.length, 2, 'case includes all versions')
  assert.deepStrictEqual(body[0].cases[0].bauRequest, {
    username: 'qa.user@example.com',
    password: 'P@ssw0rd!'
  }, 'BAU request comes from BAU timestamp')
  assert.deepStrictEqual(body[0].cases[0].request, {
    username: 'qa.user@example.com',
    password: 'P@ssw0rd!',
    deviceTrust: 'unknown'
  }, 'current request comes from current timestamp')

  {
    const result = await callRoute('GET', '/config')
    assert.strictEqual(result.status, 200, 'GET /config returns 200')
    assert.strictEqual(typeof result.body.rootDir, 'string', 'GET /config returns rootDir')
  }

  console.log('All api case route tests passed')
} finally {
  await rm(tmpDir, { recursive: true, force: true })
}
