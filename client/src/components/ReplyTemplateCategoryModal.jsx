import { useEffect, useRef, useState } from 'react'

function buildInitialState(category) {
  return {
    id: category?.id ?? '',
    name: category?.name ?? '',
    icon: category?.icon ?? ''
  }
}

export default function ReplyTemplateCategoryModal({
  mode = 'create',
  initialCategory,
  errorMessage = '',
  onConfirm,
  onClose
}) {
  const [form, setForm] = useState(() => buildInitialState(initialCategory))
  const nameRef = useRef(null)
  const allowBackdropClose = mode !== 'edit'

  useEffect(() => {
    nameRef.current?.focus()
    nameRef.current?.select()
  }, [])

  useEffect(() => {
    setForm(buildInitialState(initialCategory))
  }, [initialCategory])

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(event) {
    event.preventDefault()

    const id = form.id.trim()
    const name = form.name.trim()
    const icon = form.icon.trim()

    if (!id || !name) return
    onConfirm({ id, name, icon })
  }

  return (
    <div
      data-testid="reply-template-category-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={event => {
        if (allowBackdropClose && event.target === event.currentTarget) onClose()
      }}
    >
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-5 pb-4 pt-5">
          <h2 className="text-base font-semibold text-gray-800">
            {mode === 'edit' ? 'Edit Category' : 'Add Category'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5 pt-4">
          <div>
            <label htmlFor="reply-category-id" className="mb-1 block text-xs font-medium text-gray-500">ID</label>
            <input
              id="reply-category-id"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.id}
              onChange={event => setForm(current => ({ ...current, id: event.target.value }))}
              placeholder="release"
            />
          </div>

          <div>
            <label htmlFor="reply-category-name" className="mb-1 block text-xs font-medium text-gray-500">Name</label>
            <input
              id="reply-category-name"
              ref={nameRef}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.name}
              onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
              placeholder="Release / Build"
            />
          </div>

          <div>
            <label htmlFor="reply-category-icon" className="mb-1 block text-xs font-medium text-gray-500">
              Icon <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="reply-category-icon"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.icon}
              onChange={event => setForm(current => ({ ...current, icon: event.target.value }))}
              placeholder="🚀"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!form.id.trim() || !form.name.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mode === 'edit' ? 'Save Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
