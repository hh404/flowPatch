import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import Column from '../components/Column.jsx'

const tasks = [
  { id: '1', title: 'Task A', type: 'waiting', status: 'pending', note: '', due: null, related: null, createdAt: '', updatedAt: '' },
  { id: '2', title: 'Task B', type: 'todo', status: 'doing', note: '', due: null, related: null, createdAt: '', updatedAt: '' }
]

describe('Column', () => {
  it('renders column title', () => {
    render(<Column title="Waiting" tasks={[]} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('Waiting')).toBeInTheDocument()
  })

  it('renders all task cards', () => {
    render(<Column title="All" tasks={tasks} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('Task A')).toBeInTheDocument()
    expect(screen.getByText('Task B')).toBeInTheDocument()
  })

  it('shows empty state message when no tasks', () => {
    render(<Column title="Done" tasks={[]} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText(/completed work lands here/i)).toBeInTheDocument()
  })

  it('shows task count in header', () => {
    render(<Column title="Doing" tasks={tasks} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
