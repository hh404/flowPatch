import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ReplyTemplateReplyModal from '../components/ReplyTemplateReplyModal.jsx'

const baseReply = {
  id: 'release-timeline',
  title: 'Release timeline explanation',
  keywords: ['timeline', 'review'],
  polite: 'After code freeze, we still need time for QA.',
  firm: 'The release timeline has already been shared.'
}

describe('ReplyTemplateReplyModal', () => {
  it('closes on backdrop click while creating', async () => {
    const onClose = vi.fn()

    render(
      <ReplyTemplateReplyModal
        mode="create"
        categoryName="Release / Build"
        initialReply={null}
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    )

    await userEvent.click(screen.getByTestId('reply-template-reply-modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on backdrop click while editing', () => {
    const onClose = vi.fn()

    render(
      <ReplyTemplateReplyModal
        mode="edit"
        categoryName="Release / Build"
        initialReply={baseReply}
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByTestId('reply-template-reply-modal-backdrop'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('submits and normalizes reply fields', async () => {
    const onConfirm = vi.fn()

    render(
      <ReplyTemplateReplyModal
        mode="create"
        categoryName="Release / Build"
        initialReply={null}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    )

    await userEvent.type(screen.getByLabelText(/^id$/i), 'release-window')
    await userEvent.type(screen.getByLabelText(/^title$/i), 'Release window')
    await userEvent.type(screen.getByLabelText(/^keywords/i), 'timeline, submission{enter}timeline')
    await userEvent.type(screen.getByLabelText(/^polite$/i), 'We can only control when we submit.')
    await userEvent.type(screen.getByLabelText(/^firm$/i), 'We do not control Apple review speed after submission.')
    await userEvent.click(screen.getByRole('button', { name: /create reply/i }))

    expect(onConfirm).toHaveBeenCalledWith({
      id: 'release-window',
      title: 'Release window',
      keywords: ['timeline', 'submission'],
      polite: 'We can only control when we submit.',
      firm: 'We do not control Apple review speed after submission.'
    })
  })

  it('keeps the form body scrollable while separating the action row', () => {
    render(
      <ReplyTemplateReplyModal
        mode="edit"
        categoryName="Release / Build"
        initialReply={baseReply}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByTestId('reply-template-reply-modal-surface')).toHaveClass('max-h-[calc(100vh-2rem)]')
    expect(screen.getByTestId('reply-template-reply-modal-scroll-body')).toHaveClass('overflow-y-auto')
    expect(screen.getByTestId('reply-template-reply-modal-actions')).toHaveClass('border-t')
    expect(screen.getByRole('button', { name: /save reply/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })
})
