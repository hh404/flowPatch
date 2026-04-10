import { useEffect, useRef, useState } from 'react'

function buildInitialState(reply) {
  const legacyText = reply?.text ?? ''

  return {
    id: reply?.id ?? '',
    title: reply?.title ?? '',
    keywords: Array.isArray(reply?.keywords) ? reply.keywords.join(', ') : '',
    polite: reply?.polite ?? legacyText,
    firm: reply?.firm ?? legacyText
  }
}

function parseKeywords(value) {
  const seen = new Set()
  const keywords = []

  value
    .split(/[\n,]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .forEach(keyword => {
      const dedupeKey = keyword.toLowerCase()
      if (seen.has(dedupeKey)) return

      seen.add(dedupeKey)
      keywords.push(keyword)
    })

  return keywords
}

export default function ReplyTemplateReplyModal({
  mode = 'create',
  categoryName = '',
  initialReply,
  errorMessage = '',
  onConfirm,
  onClose
}) {
  const [form, setForm] = useState(() => buildInitialState(initialReply))
  const titleRef = useRef(null)
  const allowBackdropClose = mode !== 'edit'

  useEffect(() => {
    titleRef.current?.focus()
    titleRef.current?.select()
  }, [])

  useEffect(() => {
    setForm(buildInitialState(initialReply))
  }, [initialReply])

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
    const title = form.title.trim()
    const polite = form.polite.trim()
    const firm = form.firm.trim()
    const keywords = parseKeywords(form.keywords)

    if (!id || !title || !polite || !firm) return
    onConfirm({ id, title, keywords, polite, firm })
  }

  return (
    <div
      data-testid="reply-template-reply-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={event => {
        if (allowBackdropClose && event.target === event.currentTarget) onClose()
      }}
    >
      <div className="mx-4 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-5 pb-4 pt-5">
          <h2 className="text-base font-semibold text-gray-800">
            {mode === 'edit' ? 'Edit Reply' : 'Add Reply'}
          </h2>
          {categoryName && (
            <p className="mt-1 text-xs text-gray-500">Category: {categoryName}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="reply-template-id" className="mb-1 block text-xs font-medium text-gray-500">ID</label>
              <input
                id="reply-template-id"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.id}
                onChange={event => setForm(current => ({ ...current, id: event.target.value }))}
                placeholder="release-timeline"
              />
            </div>

            <div>
              <label htmlFor="reply-template-title" className="mb-1 block text-xs font-medium text-gray-500">Title</label>
              <input
                id="reply-template-title"
                ref={titleRef}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.title}
                onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
                placeholder="Release timeline explanation"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reply-template-keywords" className="mb-1 block text-xs font-medium text-gray-500">
              Keywords <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="reply-template-keywords"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.keywords}
              onChange={event => setForm(current => ({ ...current, keywords: event.target.value }))}
              placeholder="timeline, review, app store"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate keywords with commas or new lines.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div>
              <label htmlFor="reply-template-polite" className="mb-1 block text-xs font-medium text-gray-500">
                Polite
              </label>
              <textarea
                id="reply-template-polite"
                rows={10}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.polite}
                onChange={event => setForm(current => ({ ...current, polite: event.target.value }))}
                placeholder={'Polite version...\n\n• Bullet one\n• Bullet two'}
              />
            </div>

            <div>
              <label htmlFor="reply-template-firm" className="mb-1 block text-xs font-medium text-gray-500">
                Firm
              </label>
              <textarea
                id="reply-template-firm"
                rows={10}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.firm}
                onChange={event => setForm(current => ({ ...current, firm: event.target.value }))}
                placeholder={'Firm version...\n\n• Bullet one\n• Bullet two'}
              />
            </div>
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
              disabled={!form.id.trim() || !form.title.trim() || !form.polite.trim() || !form.firm.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mode === 'edit' ? 'Save Reply' : 'Create Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
