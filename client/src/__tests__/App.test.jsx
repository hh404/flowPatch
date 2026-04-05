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
    status: 'Ready for Develop',
    createdAt: '',
    updatedAt: '2026-04-05T11:00:00.000Z'
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
    if (url === '/api/stories' && method === 'GET') return jsonResponse(mockStories)
    if (url === '/api/tasks' && method === 'POST') return jsonResponse(mockTasks[0])
    if (url === '/api/tasks/1' && method === 'PATCH') return jsonResponse({ ...mockTasks[0], status: 'doing' })
    if (url === '/api/stories' && method === 'POST') {
      return jsonResponse({
        id: 'story-2',
        mvp: 'Search MVP',
        title: 'New story',
        link: 'https://dev.azure.com/example/story-2',
        status: 'In Review',
        createdAt: '',
        updatedAt: ''
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

  it('adds a task via QuickInput', async () => {
    const newTask = { id: '5', title: 'ask John', type: 'followup', status: 'inbox', priority: 'medium', note: '', related: null, waitingOn: null, followUpAt: null, createdAt: '', updatedAt: '' }
    global.fetch.mockImplementation((url, options = {}) => {
      const method = options.method ?? 'GET'
      if (url === '/api/tasks' && method === 'GET') return jsonResponse(mockTasks)
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
          status: 'In Review'
        })
      })
    ))
  })
})
