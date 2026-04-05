import { normalizeTaskStatus } from '../utils/taskStatus.js'
import { normalizePriority } from '../utils/priority.js'
import { formatReminderLabel } from '../utils/reminders.js'

const TYPE_COLORS = {
  todo: 'bg-gray-100 text-gray-600 border-gray-200',
  waiting: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  followup: 'bg-blue-50 text-blue-700 border-blue-200',
  'ad-hoc': 'bg-purple-50 text-purple-700 border-purple-200',
  shadow: 'bg-pink-50 text-pink-700 border-pink-200'
}

const TYPE_BADGE = {
  todo: 'bg-gray-200 text-gray-700',
  waiting: 'bg-yellow-200 text-yellow-800',
  followup: 'bg-blue-200 text-blue-800',
  'ad-hoc': 'bg-purple-200 text-purple-800',
  shadow: 'bg-pink-200 text-pink-800'
}

const STATUS_ACTIONS = {
  inbox: [{ label: 'Start', status: 'doing' }, { label: 'Wait', status: 'waiting' }, { label: 'Done', status: 'done' }],
  doing: [{ label: 'Wait', status: 'waiting' }, { label: 'Done', status: 'done' }, { label: 'Inbox', status: 'inbox' }],
  waiting: [{ label: 'Start', status: 'doing' }, { label: 'Done', status: 'done' }, { label: 'Inbox', status: 'inbox' }],
  done: [{ label: 'Reopen', status: 'inbox' }]
}

const ARIA_LABELS = {
  'doing': 'Move to Doing',
  'done': 'Move to Done',
  'inbox': 'Move to Inbox',
  'waiting': 'Move to Waiting'
}

const STATUS_BADGE = {
  inbox: 'bg-slate-200 text-slate-700',
  doing: 'bg-indigo-200 text-indigo-800',
  waiting: 'bg-amber-200 text-amber-800',
  done: 'bg-emerald-200 text-emerald-800'
}

const PRIORITY_BADGE = {
  high: 'bg-rose-200 text-rose-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-sky-100 text-sky-800'
}

const PRIORITY_RING = {
  high: 'ring-1 ring-rose-300',
  medium: 'ring-1 ring-amber-200',
  low: 'ring-1 ring-sky-200'
}

export default function TaskCard({
  task,
  onUpdate,
  onDelete,
  onEdit,
  onQuickRemind = () => {},
  onDragStart = () => {},
  onDragEnd = () => {},
  isDragging = false
}) {
  const colorClass = TYPE_COLORS[task.type] ?? TYPE_COLORS.todo
  const badgeClass = TYPE_BADGE[task.type] ?? TYPE_BADGE.todo
  const taskStatus = normalizeTaskStatus(task.status)
  const taskPriority = normalizePriority(task.priority)
  const statusClass = STATUS_BADGE[taskStatus] ?? STATUS_BADGE.inbox
  const priorityClass = PRIORITY_BADGE[taskPriority] ?? PRIORITY_BADGE.medium
  const priorityRing = PRIORITY_RING[taskPriority] ?? PRIORITY_RING.medium
  const reminderLabel = formatReminderLabel(task.remindAt)
  const canQuickRemind = taskStatus !== 'done' && (task.type === 'waiting' || task.type === 'followup' || taskStatus === 'waiting')
  const meta = [task.related, task.waitingOn, task.followUpAt, reminderLabel].filter(Boolean)

  return (
    <div
      draggable
      onDragStart={event => onDragStart(event, task)}
      onDragEnd={onDragEnd}
      className={`rounded-xl border p-3 text-sm ${colorClass} ${priorityRing} space-y-2 shadow-sm transition-opacity ${isDragging ? 'opacity-40' : 'opacity-100'} cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <span className="block font-medium leading-snug text-slate-800">{task.title}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${badgeClass}`}>{task.type}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${statusClass}`}>{taskStatus}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${priorityClass}`}>{taskPriority}</span>
          </div>
        </div>
      </div>

      {task.note && <p className="text-xs leading-relaxed opacity-75">{task.note}</p>}
      {meta.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {task.related && <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-mono text-slate-600">{task.related}</span>}
          {task.waitingOn && <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] text-slate-600">Waiting on {task.waitingOn}</span>}
          {task.followUpAt && <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] text-slate-600">Follow up {task.followUpAt}</span>}
          {reminderLabel && <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] text-slate-600">Remind {reminderLabel}</span>}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap gap-1">
          {canQuickRemind && (
            <button
              type="button"
              aria-label="Set 1 hour reminder"
              onClick={() => onQuickRemind(task)}
              className="rounded-lg border border-current/20 bg-white/60 px-2 py-1 text-xs transition-colors hover:bg-white/90"
            >
              +1h
            </button>
          )}
          {(STATUS_ACTIONS[taskStatus] ?? []).map(({ label, status }) => (
            <button
              type="button"
              key={status}
              aria-label={ARIA_LABELS[status] ?? label}
              onClick={() => onUpdate(task.id, { status })}
              className="rounded-lg border border-current/20 bg-white/60 px-2 py-1 text-xs transition-colors hover:bg-white/90"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`Edit ${task.title}`}
            onClick={() => onEdit(task)}
            className="rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-700"
          >
            Edit
          </button>
          <button
            type="button"
            aria-label={`Delete ${task.title}`}
            onClick={() => onDelete(task.id)}
            className="rounded-lg px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
