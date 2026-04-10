import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ReplyTemplatesPanel from '../components/ReplyTemplatesPanel.jsx'

const categories = [
  {
    id: 'release',
    name: 'Release / Build',
    icon: '🚀',
    replies: [
      {
        id: 'release-timeline',
        title: 'Release timeline explanation',
        keywords: ['timeline'],
        polite: 'After code freeze, we still need time for QA.',
        firm: 'The release timeline has already been shared.'
      }
    ]
  },
  {
    id: 'process',
    name: 'Process / Workflow',
    icon: '📋',
    replies: [
      {
        id: 'process-ticket-first',
        title: 'Please raise a ticket',
        keywords: ['ticket'],
        polite: 'Could you please raise a work item in ADO for this?',
        firm: 'Please raise a ticket in ADO before asking us to act.'
      }
    ]
  }
]

describe('ReplyTemplatesPanel', () => {
  it('filters categories and uses the active category for add reply', async () => {
    const onAddReply = vi.fn()

    render(
      <ReplyTemplatesPanel
        categories={categories}
        onDismissError={vi.fn()}
        onAddCategory={vi.fn()}
        onEditCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        onAddReply={onAddReply}
        onEditReply={vi.fn()}
        onDeleteReply={vi.fn()}
      />
    )

    await userEvent.type(screen.getByLabelText(/search categories/i), 'process')
    expect(screen.queryByText('Release / Build')).not.toBeInTheDocument()
    expect(screen.getAllByText('Process / Workflow').length).toBeGreaterThan(0)
    expect(screen.getByText('Please raise a ticket')).toBeInTheDocument()
    expect(screen.getByText('Could you please raise a work item in ADO for this?')).toBeInTheDocument()
    expect(screen.getByText('Please raise a ticket in ADO before asking us to act.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /add reply/i }))
    expect(onAddReply).toHaveBeenCalledWith(categories[1])
  })

  it('forwards edit and delete actions for replies', async () => {
    const onEditReply = vi.fn()
    const onDeleteReply = vi.fn()

    render(
      <ReplyTemplatesPanel
        categories={categories}
        onDismissError={vi.fn()}
        onAddCategory={vi.fn()}
        onEditCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        onAddReply={vi.fn()}
        onEditReply={onEditReply}
        onDeleteReply={onDeleteReply}
      />
    )

    await userEvent.click(screen.getByText('Release / Build'))
    await userEvent.click(screen.getByRole('button', { name: /edit reply release timeline explanation/i }))
    expect(onEditReply).toHaveBeenCalledWith(categories[0], categories[0].replies[0])

    await userEvent.click(screen.getByRole('button', { name: /delete reply release timeline explanation/i }))
    expect(onDeleteReply).toHaveBeenCalledWith(categories[0], categories[0].replies[0])
  })
})
