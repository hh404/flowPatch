import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import TaskCard from '../components/TaskCard.jsx'

const task = {
  id: '1',
  title: 'Wait for pipeline',
  type: 'waiting',
  status: 'pending',
  note: 'Build takes ~1h',
  due: null,
  related: 'ADO-1234',
  createdAt: '2026-04-05T10:00:00Z',
  updatedAt: '2026-04-05T10:00:00Z'
}

describe('TaskCard', () => {
  it('renders title and type badge', () => {
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Wait for pipeline')).toBeInTheDocument()
    expect(screen.getByText('waiting')).toBeInTheDocument()
  })

  it('shows note when present', () => {
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Build takes ~1h')).toBeInTheDocument()
  })

  it('shows related ADO link text', () => {
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('ADO-1234')).toBeInTheDocument()
  })

  it('calls onUpdate with status=doing when → Doing clicked', async () => {
    const onUpdate = vi.fn()
    render(<TaskCard task={task} onUpdate={onUpdate} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /doing/i }))
    expect(onUpdate).toHaveBeenCalledWith('1', { status: 'doing' })
  })

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn()
    render(<TaskCard task={task} onUpdate={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
