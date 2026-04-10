import { useEffect, useState } from 'react'
import { useTasks } from './hooks/useTasks.js'
import { useMvpFolders } from './hooks/useMvpFolders.js'
import { useStories } from './hooks/useStories.js'
import { useTestAccounts } from './hooks/useTestAccounts.js'
import { useReplyTemplates } from './hooks/useReplyTemplates.js'
import { useTaskReminders } from './hooks/useTaskReminders.js'
import { selectStoryLocalFolder } from './api.js'
import QuickInput from './components/QuickInput.jsx'
import Column from './components/Column.jsx'
import ReplyTemplateCategoryModal from './components/ReplyTemplateCategoryModal.jsx'
import ReplyTemplateReplyModal from './components/ReplyTemplateReplyModal.jsx'
import ReplyTemplatesPanel from './components/ReplyTemplatesPanel.jsx'
import TaskModal from './components/TaskModal.jsx'
import StoryPanel from './components/StoryPanel.jsx'
import StoryModal from './components/StoryModal.jsx'
import TestAccountModal from './components/TestAccountModal.jsx'
import TestAccountPanel from './components/TestAccountPanel.jsx'
import { compareTasksByPriority, normalizePriority } from './utils/priority.js'
import { normalizeTaskStatus } from './utils/taskStatus.js'
import { plusHours } from './utils/reminders.js'
import { DEFAULT_STORY_MVP, normalizeStoryMvp } from './utils/storyMvp.js'

const COLUMNS = [
  { title: 'Inbox', status: 'inbox' },
  { title: 'Doing', status: 'doing' },
  { title: 'Waiting', status: 'waiting' },
  { title: 'Done', status: 'done' },
]

const PAGES = {
  board: 'board',
  stories: 'stories',
  accounts: 'accounts',
  replies: 'replies'
}

function getPageFromHash() {
  const hash = window.location.hash.replace(/^#/, '').trim().toLowerCase()
  if (hash === PAGES.stories) return PAGES.stories
  if (hash === PAGES.accounts) return PAGES.accounts
  if (hash === PAGES.replies) return PAGES.replies
  return PAGES.board
}

function getPageHash(page) {
  if (page === PAGES.stories) return '#stories'
  if (page === PAGES.accounts) return '#accounts'
  if (page === PAGES.replies) return '#replies'
  return '#board'
}

function ShellHeader({ currentPage, onNavigate, summary }) {
  const tabs = [
    { key: PAGES.board, label: 'Task Board' },
    { key: PAGES.stories, label: 'Story List' },
    { key: PAGES.accounts, label: 'Test Accounts' },
    { key: PAGES.replies, label: 'Reply Library' }
  ]
  const currentPageLabel = currentPage === PAGES.stories
    ? 'Story List'
    : currentPage === PAGES.accounts
      ? 'Test Accounts'
      : currentPage === PAGES.replies
        ? 'Reply Library'
      : 'Task Board'

  return (
    <header className="border-b border-slate-800 bg-slate-900 px-4 py-4 text-white shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-3 py-2 ring-1 ring-white/10">
            <img
              src="/flowpatch-logo.svg"
              alt=""
              aria-hidden="true"
              className="h-10 w-10 rounded-xl shadow-[0_12px_32px_rgba(15,23,42,0.35)]"
            />
            <div className="leading-none">
              <span className="block text-lg font-semibold tracking-tight text-white">FlowPatch</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.34em] text-cyan-100/70">Flow Control</span>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
            {currentPageLabel}
          </span>
          <nav className="flex items-center gap-2" aria-label="Primary">
            {tabs.map(tab => {
              const isActive = currentPage === tab.key

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onNavigate(tab.key)}
                  aria-pressed={isActive}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-slate-900'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          {summary.map(item => (
            <span key={item.label} className={item.className ?? 'rounded-full bg-white/10 px-2.5 py-1'}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </header>
  )
}

function TestAccountsPage({ currentPage, onNavigate }) {
  const {
    testAccounts,
    loading,
    error,
    addTestAccount,
    updateTestAccount,
    deleteTestAccount
  } = useTestAccounts()
  const [editor, setEditor] = useState(null)
  const envCount = new Set(testAccounts.map(testAccount => testAccount.env)).size
  const simulatorCount = testAccounts.filter(testAccount => testAccount.simulator).length

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-100 text-gray-400">Loading…</div>
  if (error) return <div className="flex h-screen items-center justify-center bg-slate-100 text-red-400">Error loading data</div>

  async function handleConfirm(data) {
    if (editor?.mode === 'edit') {
      await updateTestAccount(editor.testAccount.id, data)
    } else {
      await addTestAccount(data)
    }

    setEditor(null)
  }

  function openCreateEditor() {
    setEditor({ mode: 'create', testAccount: null })
  }

  function openEditEditor(testAccount) {
    setEditor({ mode: 'edit', testAccount })
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 font-sans text-slate-900">
      <ShellHeader
        currentPage={currentPage}
        onNavigate={onNavigate}
        summary={[
          { label: `Envs ${envCount}` },
          { label: `Accounts ${testAccounts.length}` },
          { label: `Simulators ${simulatorCount}` }
        ]}
      />

      <main className="flex-1 overflow-auto p-4">
        <TestAccountPanel
          testAccounts={testAccounts}
          onAdd={openCreateEditor}
          onEdit={openEditEditor}
          onDelete={deleteTestAccount}
        />
      </main>

      {editor && (
        <TestAccountModal
          mode={editor.mode}
          initialTestAccount={editor.testAccount}
          onConfirm={handleConfirm}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}

function ReplyTemplatesPage({ currentPage, onNavigate }) {
  const {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    addReply,
    updateReply,
    deleteReply
  } = useReplyTemplates()
  const [categoryEditor, setCategoryEditor] = useState(null)
  const [replyEditor, setReplyEditor] = useState(null)
  const [editorError, setEditorError] = useState('')
  const [pageError, setPageError] = useState('')
  const replyCount = categories.reduce((total, category) => total + category.replies.length, 0)

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-100 text-gray-400">Loading…</div>
  if (error) return <div className="flex h-screen items-center justify-center bg-slate-100 text-red-400">Error loading data</div>

  function closeCategoryEditor() {
    setCategoryEditor(null)
    setEditorError('')
  }

  function closeReplyEditor() {
    setReplyEditor(null)
    setEditorError('')
  }

  function openCreateCategoryEditor() {
    setPageError('')
    setEditorError('')
    setCategoryEditor({ mode: 'create', category: null })
  }

  function openEditCategoryEditor(category) {
    setPageError('')
    setEditorError('')
    setCategoryEditor({ mode: 'edit', category })
  }

  function openCreateReplyEditor(category) {
    setPageError('')
    setEditorError('')
    setReplyEditor({ mode: 'create', category, reply: null })
  }

  function openEditReplyEditor(category, reply) {
    setPageError('')
    setEditorError('')
    setReplyEditor({ mode: 'edit', category, reply })
  }

  async function handleCategoryConfirm(data) {
    try {
      if (categoryEditor?.mode === 'edit') {
        await updateCategory(categoryEditor.category.id, data)
      } else {
        await addCategory(data)
      }

      closeCategoryEditor()
    } catch (event) {
      setEditorError(event.message || 'Could not save category.')
    }
  }

  async function handleReplyConfirm(data) {
    try {
      if (!replyEditor?.category) return

      if (replyEditor.mode === 'edit') {
        await updateReply(replyEditor.category.id, replyEditor.reply.id, data)
      } else {
        await addReply(replyEditor.category.id, data)
      }

      closeReplyEditor()
    } catch (event) {
      setEditorError(event.message || 'Could not save reply.')
    }
  }

  async function handleDeleteCategory(category) {
    try {
      await deleteCategory(category.id)
      setPageError('')
    } catch (event) {
      setPageError(event.message || 'Could not delete category.')
    }
  }

  async function handleDeleteReply(category, reply) {
    try {
      await deleteReply(category.id, reply.id)
      setPageError('')
    } catch (event) {
      setPageError(event.message || 'Could not delete reply.')
    }
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 font-sans text-slate-900">
      <ShellHeader
        currentPage={currentPage}
        onNavigate={onNavigate}
        summary={[
          { label: `Categories ${categories.length}` },
          { label: `Replies ${replyCount}` }
        ]}
      />

      <main className="flex-1 overflow-auto p-4">
        <ReplyTemplatesPanel
          categories={categories}
          errorMessage={pageError}
          onDismissError={() => setPageError('')}
          onAddCategory={openCreateCategoryEditor}
          onEditCategory={openEditCategoryEditor}
          onDeleteCategory={handleDeleteCategory}
          onAddReply={openCreateReplyEditor}
          onEditReply={openEditReplyEditor}
          onDeleteReply={handleDeleteReply}
        />
      </main>

      {categoryEditor && (
        <ReplyTemplateCategoryModal
          mode={categoryEditor.mode}
          initialCategory={categoryEditor.category}
          errorMessage={editorError}
          onConfirm={handleCategoryConfirm}
          onClose={closeCategoryEditor}
        />
      )}

      {replyEditor && (
        <ReplyTemplateReplyModal
          mode={replyEditor.mode}
          categoryName={replyEditor.category?.name ?? ''}
          initialReply={replyEditor.reply}
          errorMessage={editorError}
          onConfirm={handleReplyConfirm}
          onClose={closeReplyEditor}
        />
      )}
    </div>
  )
}

function BoardPage({ currentPage, onNavigate }) {
  const { tasks, loading, error, addTask, updateTask, deleteTask } = useTasks()
  const [editor, setEditor] = useState(null)
  const [draggedTaskId, setDraggedTaskId] = useState(null)
  const [dragOverStatus, setDragOverStatus] = useState(null)
  const normalizedTasks = tasks.map(task => ({
    ...task,
    status: normalizeTaskStatus(task.status),
    priority: normalizePriority(task.priority)
  }))
  const {
    alerts,
    dismissAlert,
    notificationsSupported,
    notificationPermission,
    requestPermission
  } = useTaskReminders(normalizedTasks, updateTask)
  const counts = {
    inbox: normalizedTasks.filter(task => task.status === 'inbox').length,
    doing: normalizedTasks.filter(task => task.status === 'doing').length,
    waiting: normalizedTasks.filter(task => task.status === 'waiting').length,
    done: normalizedTasks.filter(task => task.status === 'done').length
  }
  const openHighPriorityCount = normalizedTasks.filter(task => task.status !== 'done' && task.priority === 'high').length

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-100 text-gray-400">Loading…</div>
  if (error) return <div className="flex h-screen items-center justify-center bg-slate-100 text-red-400">Error loading data</div>

  async function handleConfirm(data) {
    if (editor?.mode === 'edit') {
      await updateTask(editor.task.id, data)
    } else {
      await addTask(data)
    }

    setEditor(null)
  }

  function openCreateEditor(draft) {
    setEditor({ mode: 'create', task: draft })
  }

  function openEditEditor(task) {
    setEditor({ mode: 'edit', task })
  }

  function handleDragStart(event, task) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', task.id)
    setDraggedTaskId(task.id)
  }

  function handleDragEnd() {
    setDraggedTaskId(null)
    setDragOverStatus(null)
  }

  function handleDragEnter(status) {
    setDragOverStatus(status)
  }

  function handleDragLeave(status) {
    setDragOverStatus(current => (current === status ? null : current))
  }

  async function handleDropTask(status) {
    if (!draggedTaskId) return

    const draggedTask = normalizedTasks.find(task => task.id === draggedTaskId)
    if (!draggedTask) {
      handleDragEnd()
      return
    }

    if (draggedTask.status !== status) {
      await updateTask(draggedTaskId, { status })
    }

    handleDragEnd()
  }

  async function handleQuickRemind(task) {
    await updateTask(task.id, {
      remindAt: plusHours(1),
      remindedAt: null
    })
  }

  const summary = [
    { label: `Inbox ${counts.inbox}` },
    { label: `Doing ${counts.doing}` },
    { label: `Waiting ${counts.waiting}` },
    { label: `Done ${counts.done}` },
    { label: `High ${openHighPriorityCount}`, className: 'rounded-full bg-rose-500/15 px-2.5 py-1 text-rose-200' }
  ]

  return (
    <div className="flex h-screen flex-col bg-slate-100 font-sans text-slate-900">
      <ShellHeader currentPage={currentPage} onNavigate={onNavigate} summary={summary} />

      {notificationsSupported && notificationPermission !== 'granted' && (
        <section className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <span>Enable browser notifications for pipeline and follow-up reminders.</span>
            <button
              type="button"
              onClick={requestPermission}
              className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-slate-700"
            >
              Enable Notifications
            </button>
          </div>
        </section>
      )}

      <QuickInput onAdd={addTask} onOpenDetails={openCreateEditor} />

      {alerts.length > 0 && (
        <section className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Reminders</div>
          <div className="flex flex-col gap-2">
            {alerts.map(alert => (
              <div key={alert.key} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-white px-3 py-2">
                <div className="text-sm text-slate-700">
                  <span className="font-medium">{alert.title}</span>
                  <span className="text-slate-500"> needs attention now.</span>
                </div>
                <button
                  type="button"
                  onClick={() => dismissAlert(alert.key)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 xl:grid-cols-4">
        {COLUMNS.map(({ title, status }) => (
          <Column
            key={title}
            title={title}
            status={status}
            tasks={normalizedTasks.filter(task => task.status === status).sort(compareTasksByPriority)}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onEdit={openEditEditor}
            onQuickRemind={handleQuickRemind}
            onDropTask={handleDropTask}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            draggedTaskId={draggedTaskId}
            isDragActive={dragOverStatus === status}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          />
        ))}
      </main>

      {editor && (
        <TaskModal
          mode={editor.mode}
          initialTask={editor.task}
          onConfirm={handleConfirm}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}

function StoriesPage({ currentPage, onNavigate }) {
  const { stories, loading, error, addStory, updateStory, deleteStory } = useStories()
  const {
    mvpFolders,
    loading: mvpFoldersLoading,
    error: mvpFoldersError,
    setMvpFolder,
    setMvpShortcuts,
    deleteMvpFolder
  } = useMvpFolders()
  const [storyEditor, setStoryEditor] = useState(null)
  const mvpNames = [...new Set([
    ...stories.map(story => normalizeStoryMvp(story.mvp)),
    ...mvpFolders.map(item => normalizeStoryMvp(item.name))
  ])].sort((left, right) => left.localeCompare(right))
  const storyCount = stories.length
  const shortcutCount = mvpFolders.reduce((total, item) => total + (item.shortcuts?.length ?? 0), 0)

  if (loading || mvpFoldersLoading) return <div className="flex h-screen items-center justify-center bg-slate-100 text-gray-400">Loading…</div>
  if (error || mvpFoldersError) return <div className="flex h-screen items-center justify-center bg-slate-100 text-red-400">Error loading data</div>

  async function handleStoryConfirm(data) {
    if (storyEditor?.mode === 'edit') {
      await updateStory(storyEditor.story.id, data)
    } else {
      await addStory(data)
    }

    setStoryEditor(null)
  }

  function openCreateStoryEditor(mvp = DEFAULT_STORY_MVP) {
    setStoryEditor({ mode: 'create', story: { mvp: normalizeStoryMvp(mvp) } })
  }

  function openEditStoryEditor(story) {
    setStoryEditor({ mode: 'edit', story })
  }

  async function handleChooseMvpFolder(name, currentFolder = '') {
    const result = await selectStoryLocalFolder(currentFolder)
    const path = result.path?.trim() ?? ''
    if (!path) return

    await setMvpFolder(name, path)
  }

  async function handleClearMvpFolder(name) {
    await deleteMvpFolder(name)
  }

  async function handleSetMvpShortcuts(name, shortcuts) {
    await setMvpShortcuts(name, shortcuts)
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 font-sans text-slate-900">
      <ShellHeader
        currentPage={currentPage}
        onNavigate={onNavigate}
        summary={[
          { label: `MVPs ${mvpNames.length}` },
          { label: `Stories ${storyCount}` },
          { label: `Shortcuts ${shortcutCount}` }
        ]}
      />

      <main className="flex-1 overflow-auto p-4">
        <StoryPanel
          stories={stories}
          mvpFolders={mvpFolders}
          onAdd={openCreateStoryEditor}
          onEdit={openEditStoryEditor}
          onDelete={deleteStory}
          onSetMvpFolder={handleChooseMvpFolder}
          onClearMvpFolder={handleClearMvpFolder}
          onSetMvpShortcuts={handleSetMvpShortcuts}
        />
      </main>

      {storyEditor && (
        <StoryModal
          mode={storyEditor.mode}
          initialStory={storyEditor.story}
          mvpOptions={mvpNames}
          onConfirm={handleStoryConfirm}
          onClose={() => setStoryEditor(null)}
        />
      )}
    </div>
  )
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => getPageFromHash())

  useEffect(() => {
    function handleHashChange() {
      setCurrentPage(getPageFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function navigateTo(page) {
    const nextPage = Object.values(PAGES).includes(page) ? page : PAGES.board
    setCurrentPage(nextPage)
    window.location.hash = getPageHash(nextPage)
  }

  if (currentPage === PAGES.stories) {
    return <StoriesPage currentPage={currentPage} onNavigate={navigateTo} />
  }

  if (currentPage === PAGES.accounts) {
    return <TestAccountsPage currentPage={currentPage} onNavigate={navigateTo} />
  }

  if (currentPage === PAGES.replies) {
    return <ReplyTemplatesPage currentPage={currentPage} onNavigate={navigateTo} />
  }

  return <BoardPage currentPage={currentPage} onNavigate={navigateTo} />
}
