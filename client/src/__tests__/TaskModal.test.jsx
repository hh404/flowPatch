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
})
