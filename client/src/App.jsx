import { useTasks } from './hooks/useTasks.js'
import QuickInput from './components/QuickInput.jsx'
import Column from './components/Column.jsx'

const COLUMNS = [
  { title: 'Doing', statuses: ['doing'] },
  { title: 'Waiting', statuses: ['pending'] },
  { title: 'Done', statuses: ['done'] }
]

export default function App() {
  const { tasks, loading, error, addTask, updateTask, deleteTask } = useTasks()

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Loading…</div>
  if (error) return <div className="flex h-screen items-center justify-center text-red-400">Error loading tasks</div>

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <header className="flex items-center gap-3 px-4 py-3 bg-indigo-700 text-white shadow">
        <span className="text-lg font-bold tracking-tight">FlowPatch</span>
        <span className="text-indigo-300 text-sm">Reality Tracker</span>
      </header>

      <QuickInput onAdd={addTask} />

      <main className="flex flex-1 gap-4 p-4 overflow-hidden">
        {COLUMNS.map(({ title, statuses }) => (
          <Column
            key={title}
            title={title}
            tasks={tasks.filter(t => statuses.includes(t.status))}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        ))}
      </main>
    </div>
  )
}
