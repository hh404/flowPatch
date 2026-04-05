import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import App from '../App.jsx'

const mockTasks = [
  { id: '1', title: 'Wait for pipeline', type: 'waiting', status: 'pending', note: '', due: null, related: null, createdAt: '', updatedAt: '' },
  { id: '2', title: 'Fix the bug', type: 'todo', status: 'doing', note: '', due: null, related: null, createdAt: '', updatedAt: '' },
  { id: '3', title: 'Old PR', type: 'todo', status: 'done', note: '', due: null, related: null, createdAt: '', updatedAt: '' }
]

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockTasks })
})

afterEach(() => vi.restoreAllMocks())

describe('App', () => {
  it('renders three kanban columns', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Doing')).toBeInTheDocument())
    expect(screen.getByText('Waiting')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('renders tasks in correct columns', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Wait for pipeline')).toBeInTheDocument())
    expect(screen.getByText('Fix the bug')).toBeInTheDocument()
    expect(screen.getByText('Old PR')).toBeInTheDocument()
  })

  it('adds a task via QuickInput', async () => {
    const newTask = { id: '4', title: 'ask John', type: 'followup', status: 'pending', note: '', due: null, related: null, createdAt: '', updatedAt: '' }
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
      .mockResolvedValueOnce({ ok: true, json: async () => newTask })

    render(<App />)
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument())

    const input = screen.getByPlaceholderText(/add task/i)
    await userEvent.type(input, 'ask John{Enter}')

    await waitFor(() => expect(screen.getByText('ask John')).toBeInTheDocument())
  })
})
