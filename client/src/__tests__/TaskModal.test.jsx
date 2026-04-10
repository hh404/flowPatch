import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TaskModal from '../components/TaskModal.jsx'

const baseTask = {
  title: 'Check pipeline',
  type: 'todo',
  status: 'doing',
  priority: 'medium',
  note: 'Keep an eye on deployment',
  related: 'ADO-1234',
  waitingOn: '',
  followUpAt: '',
  remindAt: null
}

describe('TaskModal', () => {
  it('closes on backdrop click while creating', async () => {
    const onClose = vi.fn()

    render(
      <TaskModal
        mode="create"
        initialTask={null}
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    )

    await userEvent.click(screen.getByTestId('task-modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on backdrop click while editing', () => {
    const onClose = vi.fn()

    render(
      <TaskModal
        mode="edit"
        initialTask={baseTask}
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByTestId('task-modal-backdrop'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('keeps the form body scrollable while separating the action row', () => {
    render(
      <TaskModal
        mode="edit"
        initialTask={baseTask}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByTestId('task-modal-surface')).toHaveClass('max-h-[calc(100vh-2rem)]')
    expect(screen.getByTestId('task-modal-scroll-body')).toHaveClass('overflow-y-auto')
    expect(screen.getByTestId('task-modal-actions')).toHaveClass('border-t')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })
})
