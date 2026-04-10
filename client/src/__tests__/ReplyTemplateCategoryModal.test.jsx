import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ReplyTemplateCategoryModal from '../components/ReplyTemplateCategoryModal.jsx'

const baseCategory = {
  id: 'release',
  name: 'Release / Build',
  icon: '🚀'
}

describe('ReplyTemplateCategoryModal', () => {
  it('closes on backdrop click while creating', async () => {
    const onClose = vi.fn()

    render(
      <ReplyTemplateCategoryModal
        mode="create"
        initialCategory={null}
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    )

    await userEvent.click(screen.getByTestId('reply-template-category-modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on backdrop click while editing', () => {
    const onClose = vi.fn()

    render(
      <ReplyTemplateCategoryModal
        mode="edit"
        initialCategory={baseCategory}
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByTestId('reply-template-category-modal-backdrop'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('submits the category fields', async () => {
    const onConfirm = vi.fn()

    render(
      <ReplyTemplateCategoryModal
        mode="create"
        initialCategory={null}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    )

    await userEvent.type(screen.getByLabelText(/^id$/i), 'process')
    await userEvent.type(screen.getByLabelText(/^name$/i), 'Process / Workflow')
    await userEvent.type(screen.getByLabelText(/^icon/i), 'P')
    await userEvent.click(screen.getByRole('button', { name: /create category/i }))

    expect(onConfirm).toHaveBeenCalledWith({
      id: 'process',
      name: 'Process / Workflow',
      icon: 'P'
    })
  })
})
