import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'

const mockTasks = [
  { id: '1', title: 'Wait for pipeline', type: 'waiting', status: 'waiting', priority: 'high', note: '', related: null, waitingOn: null, followUpAt: null, remindAt: null, remindedAt: null, createdAt: '', updatedAt: '2026-04-05T10:00:00.000Z' },
  { id: '2', title: 'Fix the bug', type: 'todo', status: 'doing', priority: 'medium', note: '', related: null, waitingOn: null, followUpAt: null, remindAt: null, remindedAt: null, createdAt: '', updatedAt: '2026-04-05T09:00:00.000Z' },
  { id: '3', title: 'Old PR', type: 'todo', status: 'done', priority: 'low', note: '', related: null, waitingOn: null, followUpAt: null, remindAt: null, remindedAt: null, createdAt: '', updatedAt: '2026-04-05T08:00:00.000Z' },
  { id: '4', title: 'Check logs', type: 'followup', status: 'waiting', priority: 'low', note: '', related: null, waitingOn: null, followUpAt: null, remindAt: null, remindedAt: null, createdAt: '', updatedAt: '2026-04-05T11:00:00.000Z' }
]

const mockStories = [
  {
    id: 'story-1',
    mvp: 'Core Platform MVP',
    title: 'Story tracker',
    link: 'https://dev.azure.com/example/story-1',
    branch: 'feature/story-tracker',
    folder: '/Users/hans/workspaces/core-platform/story-tracker',
    description: 'Draft lives in [proto](/Users/hans/mockups/proto.html)',
    status: 'Ready for Develop',
    createdAt: '',
    updatedAt: '2026-04-05T11:00:00.000Z'
  }
]

const mockTestAccounts = [
  {
    id: 'account-1',
    env: 'staging',
    account: 'qa.flowpatch@example.com',
    password: 'Secret123!',
    note: 'Use for smoke tests',
    simulator: 'iPhone 16 Pro',
    usedBy: 'Hans',
    bankId: 'bankid-001',
    createdAt: '',
    updatedAt: '2026-04-05T11:00:00.000Z'
  }
]

const mockReplyTemplates = {
  categories: [
    {
      id: 'release',
      name: 'Release / Build',
      icon: '🚀',
      replies: [
        {
          id: 'release-timeline',
          title: 'Release timeline explanation',
          keywords: ['timeline', 'review'],
          polite: 'After code freeze, we still need time for QA.',
          firm: 'The release timeline has already been shared.'
        }
      ]
    }
  ]
}

const mockPackageReleases = [
  {
    id: 'package-1',
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
      stories: ['ADO#1001 Story tracker']
    },
    checklist: { branchCorrect: true, ticketScope: true },
    notes: {
      teamsMessage: 'Teams message',
      buildStartMessage: 'Starting build with version 23.0.0.',
      adoComment: 'ADO comment',
      emailSubject: '[SG][WISE] SIT',
      emailBody: 'Email body',
      confluenceRow: '| 2026-04-13 | 12345 |'
    },
    qaConfirmed: false,
    createdAt: '2026-04-13T10:00:00.000Z',
    updatedAt: '2026-04-13T10:00:00.000Z'
  }
]

const mockApiCases = [
  {
    id: 'auth-login',
    name: 'Auth Login',
    method: 'POST',
    path: '/api/v1/auth/login',
    cases: [
      {
        id: 'INFT.login.device.faceid.risk',
        name: 'INFT FaceID Risk',
        description: 'FaceID login under risk policy branch.',
        bauVersion: '20260404122322',
        currentVersion: '20260407153010',
        bauRequest: { username: 'qa.user@example.com', password: 'P@ssw0rd!' },
        bauResponse: { code: '0', message: 'success-bau' },
        request: { username: 'qa.user@example.com', password: 'P@ssw0rd!', deviceTrust: 'unknown' },
        response: { code: '0', message: 'success-current' },
        versions: [
          {
            timestamp: '20260407153010',
            request: { username: 'qa.user@example.com', password: 'P@ssw0rd!', deviceTrust: 'unknown' },
            response: { code: '0', message: 'success-current' },
            isBau: false,
            isCurrent: true
          },
          {
            timestamp: '20260404122322',
            request: { username: 'qa.user@example.com', password: 'P@ssw0rd!' },
            response: { code: '0', message: 'success-bau' },
            isBau: true,
            isCurrent: false
          }
        ]
      }
    ]
  }
]

function jsonResponse(body) {
  return Promise.resolve({ ok: true, json: async () => body })
}

beforeEach(() => {
  window.location.hash = ''
  global.fetch = vi.fn((url, options = {}) => {
    const method = options.method ?? 'GET'

    if (url === '/api/tasks' && method === 'GET') return jsonResponse(mockTasks)
    if (url === '/api/mvps' && method === 'GET') return jsonResponse([
      { name: 'Core Platform MVP', folder: '/Users/hans/workspaces/core-platform' }
    ])
    if (url === '/api/stories' && method === 'GET') return jsonResponse(mockStories)
    if (url === '/api/test-accounts' && method === 'GET') return jsonResponse(mockTestAccounts)
    if (url === '/api/reply-templates' && method === 'GET') return jsonResponse(mockReplyTemplates)
    if (url === '/api/package-releases' && method === 'GET') return jsonResponse(mockPackageReleases)
    if (url === '/api/api-cases/config' && method === 'GET') return jsonResponse({ rootDir: '/mock/api-cases' })
    if (url === '/api/api-cases' && method === 'GET') return jsonResponse(mockApiCases)
    if (url === '/api/tasks' && method === 'POST') return jsonResponse(mockTasks[0])
    if (url === '/api/tasks/1' && method === 'PATCH') return jsonResponse({ ...mockTasks[0], status: 'doing' })
    if (url === '/api/stories' && method === 'POST') {
      return jsonResponse({
        id: 'story-2',
        mvp: 'Search MVP',
        title: 'New story',
        link: 'https://dev.azure.com/example/story-2',
        branch: 'feature/search-story',
        folder: '/Users/hans/workspaces/search/new-story',
        description: 'Half built with [demo](/Users/hans/mockups/demo.html)',
        status: 'In Review',
        createdAt: '',
        updatedAt: ''
      })
    }
    if (url === '/api/test-accounts' && method === 'POST') {
      return jsonResponse({
        id: 'account-2',
        env: 'prod',
        account: 'prod.flowpatch@example.com',
        password: 'Prod123!',
        note: 'Use for prod smoke tests',
        simulator: 'iPhone 16',
        usedBy: 'QA Team',
        bankId: 'bankid-999',
        createdAt: '',
        updatedAt: ''
      })
    }
    if (url === '/api/reply-templates/categories' && method === 'POST') {
      return jsonResponse({
        id: 'process',
        name: 'Process / Workflow',
        icon: '📋',
        replies: []
      })
    }

    return jsonResponse({})
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('App', () => {
  it('renders kanban columns on the board page by default', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'Doing' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Waiting' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Done' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /story list/i })).not.toBeInTheDocument()
  })

  it('navigates to the story page and renders stories there', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Wait for pipeline')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Story List' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /story list/i })).toBeInTheDocument())

    expect(screen.getByRole('tab', { name: /core platform mvp/i })).toBeInTheDocument()
    expect(screen.getByText('Story tracker')).toBeInTheDocument()
    expect(screen.queryByText('Wait for pipeline')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Inbox' })).not.toBeInTheDocument()
  })

  it('navigates to the test accounts page and renders accounts there', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Wait for pipeline')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Test Accounts' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /test accounts/i })).toBeInTheDocument())

    expect(screen.getAllByText('qa.flowpatch@example.com').length).toBeGreaterThan(0)
    expect(screen.getByText('iPhone 16 Pro')).toBeInTheDocument()
    expect(screen.getByText('Hans')).toBeInTheDocument()
    expect(screen.getByText('bankid-001')).toBeInTheDocument()
    expect(screen.queryByText('Wait for pipeline')).not.toBeInTheDocument()
  })

  it('navigates to the reply library and renders templates there', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Wait for pipeline')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Reply Library' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /reply library/i })).toBeInTheDocument())

    expect(screen.getAllByText('Release / Build').length).toBeGreaterThan(0)
    expect(screen.getByText('Release timeline explanation')).toBeInTheDocument()
    expect(screen.getByText('The release timeline has already been shared.')).toBeInTheDocument()
    expect(screen.queryByText('Wait for pipeline')).not.toBeInTheDocument()
  })

  it('navigates to the package SOP page and renders release records', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Wait for pipeline')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Package SOP' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /package sop/i })).toBeInTheDocument())

    expect(screen.getByText('Build 12345')).toBeInTheDocument()
    expect(screen.getAllByText(/ADO#1001 Story tracker/).length).toBeGreaterThan(0)
    expect(screen.getByText(/"appVersion": "23.0.0"/)).toBeInTheDocument()
    expect(screen.getByText(/"buildNumber": "12345"/)).toBeInTheDocument()
    expect(screen.queryByText('Wait for pipeline')).not.toBeInTheDocument()
  })

  it('navigates to the API cases page and renders request response payloads', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Wait for pipeline')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'API Cases' }))
    await waitFor(() => expect(screen.getByText('Auth Login')).toBeInTheDocument())

    expect(screen.getByText('/api/v1/auth/login')).toBeInTheDocument()
    expect(screen.getByText('INFT FaceID Risk')).toBeInTheDocument()
    expect(screen.getByText(/"deviceTrust": "unknown"/)).toBeInTheDocument()
    expect(screen.getByText(/"message": "success-current"/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'BAU' }))
    expect(screen.getByText(/"message": "success-bau"/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'All Versions' }))
    expect(screen.getByText('20260407153010')).toBeInTheDocument()
    expect(screen.getByText('20260404122322')).toBeInTheDocument()
  })

  it('adds a task via QuickInput', async () => {
    const newTask = { id: '5', title: 'ask John', type: 'followup', status: 'inbox', priority: 'medium', note: '', related: null, waitingOn: null, followUpAt: null, createdAt: '', updatedAt: '' }
    global.fetch.mockImplementation((url, options = {}) => {
      const method = options.method ?? 'GET'
      if (url === '/api/tasks' && method === 'GET') return jsonResponse(mockTasks)
      if (url === '/api/mvps' && method === 'GET') return jsonResponse([
        { name: 'Core Platform MVP', folder: '/Users/hans/workspaces/core-platform' }
      ])
      if (url === '/api/stories' && method === 'GET') return jsonResponse(mockStories)
      if (url === '/api/tasks' && method === 'POST') return jsonResponse(newTask)
      return jsonResponse({})
    })

    render(<App />)
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument())

    const input = screen.getByPlaceholderText(/capture fast/i)
    await userEvent.type(input, 'ask John{Enter}')

    await waitFor(() => expect(screen.getByText('ask John')).toBeInTheDocument())
  })

  it('moves a card between columns with drag and drop', async () => {
    const updatedTask = { ...mockTasks[0], status: 'doing' }
    global.fetch.mockImplementation((url, options = {}) => {
      const method = options.method ?? 'GET'
      if (url === '/api/tasks' && method === 'GET') return jsonResponse(mockTasks)
      if (url === '/api/mvps' && method === 'GET') return jsonResponse([
        { name: 'Core Platform MVP', folder: '/Users/hans/workspaces/core-platform' }
      ])
      if (url === '/api/stories' && method === 'GET') return jsonResponse(mockStories)
      if (url === '/api/tasks/1' && method === 'PATCH') return jsonResponse(updatedTask)
      return jsonResponse({})
    })

    render(<App />)
    await waitFor(() => expect(screen.getByText('Wait for pipeline')).toBeInTheDocument())

    const card = screen.getByText('Wait for pipeline').closest('[draggable="true"]')
    const doingColumn = screen.getByLabelText('Doing column')
    const dataTransfer = {
      effectAllowed: '',
      setData: vi.fn()
    }

    fireEvent.dragStart(card, { dataTransfer })
    fireEvent.dragEnter(doingColumn)
    fireEvent.drop(doingColumn)

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      '/api/tasks/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'doing' })
      })
    ))
  })

  it('sorts higher priority tasks first within a column', async () => {
    render(<App />)
    const waitingColumn = await screen.findByLabelText('Waiting column')
    const titles = within(waitingColumn)
      .getAllByText(/Wait for pipeline|Check logs/)
      .map(node => node.textContent)

    expect(titles).toEqual(['Wait for pipeline', 'Check logs'])
  })

  it('creates a story from the story page', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Wait for pipeline')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Story List' }))
    await waitFor(() => expect(screen.getByText('Story tracker')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: /^add story$/i }))
    await userEvent.clear(screen.getByLabelText(/^mvp$/i))
    await userEvent.type(screen.getByLabelText(/^mvp$/i), 'Search MVP')
    await userEvent.type(screen.getByLabelText(/title/i), 'New story')
    await userEvent.type(screen.getByLabelText(/link/i), 'https://dev.azure.com/example/story-2')
    await userEvent.type(screen.getByLabelText(/^branch/i), 'feature/search-story')
    fireEvent.change(screen.getByLabelText(/^description$/i), {
      target: { value: 'Half built with [demo](/Users/hans/mockups/demo.html)' }
    })
    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'In Review')
    await userEvent.click(screen.getByRole('button', { name: /create story/i }))

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      '/api/stories',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          mvp: 'Search MVP',
          title: 'New story',
          link: 'https://dev.azure.com/example/story-2',
          branch: 'feature/search-story',
          folder: '',
          description: 'Half built with [demo](/Users/hans/mockups/demo.html)',
          status: 'In Review'
        })
      })
    ))
  })

  it('creates a test account from the accounts page', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Wait for pipeline')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Test Accounts' }))
    await waitFor(() => expect(screen.getAllByText('qa.flowpatch@example.com').length).toBeGreaterThan(0))

    await userEvent.click(screen.getByRole('button', { name: /^add account$/i }))
    await userEvent.type(screen.getByPlaceholderText('dev / qa / staging / prod'), 'prod')
    await userEvent.type(screen.getByLabelText(/^account$/i), 'prod.flowpatch@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Prod123!')
    await userEvent.type(screen.getByLabelText(/simulator marker/i), 'iPhone 16')
    await userEvent.type(screen.getByLabelText(/in use by/i), 'QA Team')
    await userEvent.type(screen.getByLabelText(/bank id/i), 'bankid-999')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      '/api/test-accounts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          env: 'prod',
          account: 'prod.flowpatch@example.com',
          password: 'Prod123!',
          note: '',
          simulator: 'iPhone 16',
          usedBy: 'QA Team',
          bankId: 'bankid-999'
        })
      })
    ))
  })

  it('creates a reply category from the reply library page', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Wait for pipeline')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Reply Library' }))
    await waitFor(() => expect(screen.getByText('Release timeline explanation')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: /^add category$/i }))
    await userEvent.type(screen.getByLabelText(/^id$/i), 'process')
    await userEvent.type(screen.getByLabelText(/^name$/i), 'Process / Workflow')
    await userEvent.type(screen.getByLabelText(/^icon/i), '📋')
    await userEvent.click(screen.getByRole('button', { name: /create category/i }))

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      '/api/reply-templates/categories',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          id: 'process',
          name: 'Process / Workflow',
          icon: '📋'
        })
      })
    ))
  })
})
