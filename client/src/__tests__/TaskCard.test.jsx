import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import TaskCard from '../components/TaskCard.jsx'

const task = {
  id: '1',
  title: 'Wait for pipeline',
  type: 'waiting',
  status: 'waiting',
  priority: 'high',
  note: 'Build takes ~1h',
  related: 'ADO-1234',
  waitingOn: 'CI',
  followUpAt: '2026-04-07',
  remindAt: '2026-04-05T11:00:00.000Z',
  remindedAt: null,
  createdAt: '2026-04-05T10:00:00Z',
  updatedAt: '2026-04-05T10:00:00Z'
}

describe('TaskCard', () => {
  it('renders title and type badge', () => {
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('Wait for pipeline')).toBeInTheDocument()
    expect(screen.getAllByText('waiting')).toHaveLength(2)
    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('shows note when present', () => {
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('Build takes ~1h')).toBeInTheDocument()
  })

  it('shows related ADO link text', () => {
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('ADO-1234')).toBeInTheDocument()
  })

  it('shows waiting metadata when present', () => {
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText(/waiting on ci/i)).toBeInTheDocument()
    expect(screen.getByText(/follow up 2026-04-07/i)).toBeInTheDocument()
    expect(screen.getByText(/remind/i)).toBeInTheDocument()
  })

  it('calls onUpdate with status=doing when Start clicked', async () => {
    const onUpdate = vi.fn()
    render(<TaskCard task={task} onUpdate={onUpdate} onDelete={vi.fn()} onEdit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /move to doing/i }))
    expect(onUpdate).toHaveBeenCalledWith('1', { status: 'doing' })
  })

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn()
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = vi.fn()
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(task)
  })

  it('calls onQuickRemind when +1h clicked', async () => {
    const onQuickRemind = vi.fn()
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} onQuickRemind={onQuickRemind} />)
    await userEvent.click(screen.getByRole('button', { name: /set 1 hour reminder/i }))
    expect(onQuickRemind).toHaveBeenCalledWith(task)
  })

  it('is draggable', () => {
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />)
    const card = screen.getByText('Wait for pipeline').closest('[draggable="true"]')
    expect(card).not.toBeNull()
  })

  it('shows correct actions for doing status', () => {
    const doingTask = { ...task, status: 'doing' }
    render(<TaskCard task={doingTask} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /move to waiting/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /move to done/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /move to inbox/i })).toBeInTheDocument()
  })

  it('shows correct actions for done status', () => {
    const doneTask = { ...task, status: 'done' }
    render(<TaskCard task={doneTask} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /move to inbox/i })).toBeInTheDocument()
  })
})
