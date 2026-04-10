import { useEffect, useMemo, useState } from 'react'

function compareCategories(left, right) {
  const nameDiff = left.name.localeCompare(right.name)
  if (nameDiff !== 0) return nameDiff
  return left.id.localeCompare(right.id)
}

function compareReplies(left, right) {
  const titleDiff = left.title.localeCompare(right.title)
  if (titleDiff !== 0) return titleDiff
  return left.id.localeCompare(right.id)
}

function matchesCategory(category, query) {
  if (!query) return true
  const text = [category.id, category.name, category.icon].join('\n').toLowerCase()
  return text.includes(query)
}

export default function ReplyTemplatesPanel({
  categories,
  errorMessage = '',
  onDismissError,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddReply,
  onEditReply,
  onDeleteReply
}) {
  const [categoryQuery, setCategoryQuery] = useState('')
  const sortedCategories = useMemo(() => [...categories].sort(compareCategories), [categories])
  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase()
    return sortedCategories.filter(category => matchesCategory(category, query))
  }, [categoryQuery, sortedCategories])
  const [activeCategoryId, setActiveCategoryId] = useState('')

  useEffect(() => {
    if (filteredCategories.length === 0) {
      setActiveCategoryId('')
      return
    }

    if (!filteredCategories.some(category => category.id === activeCategoryId)) {
      setActiveCategoryId(filteredCategories[0].id)
    }
  }, [activeCategoryId, filteredCategories])

  const activeCategory = filteredCategories.find(category => category.id === activeCategoryId) ?? null
  const activeReplies = activeCategory ? [...activeCategory.replies].sort(compareReplies) : []

  return (
    <section className="mx-auto w-full max-w-7xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Reply Library</h2>
          <p className="mt-1 text-xs text-slate-500">
            Edit your reply-template JSON with category and reply level CRUD.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {categories.length} categories
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
            {categories.reduce((total, category) => total + category.replies.length, 0)} replies
          </span>
          <button
            type="button"
            onClick={onAddCategory}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Add Category
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={onDismissError}
            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-medium transition-colors hover:bg-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
          No categories yet. Add your first category to start editing this JSON library.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div>
              <label htmlFor="reply-category-search" className="mb-1 block text-xs font-medium text-slate-500">
                Search Categories
              </label>
              <input
                id="reply-category-search"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={categoryQuery}
                onChange={event => setCategoryQuery(event.target.value)}
                placeholder="Filter by id or name..."
              />
            </div>

            <div className="space-y-2">
              {filteredCategories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-sm text-slate-500">
                  No categories match the current filter.
                </div>
              ) : (
                filteredCategories.map(category => {
                  const isActive = category.id === activeCategoryId

                  return (
                    <div
                      key={category.id}
                      className={`rounded-2xl border px-3 py-3 transition-colors ${
                        isActive
                          ? 'border-slate-900 bg-white shadow-sm'
                          : 'border-transparent bg-white/70 hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveCategoryId(category.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{category.icon || '🗂️'}</span>
                              <span className="truncate text-sm font-semibold text-slate-800">{category.name}</span>
                            </div>
                            <div className="mt-1 truncate font-mono text-[11px] text-slate-500">{category.id}</div>
                          </div>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                            {category.replies.length}
                          </span>
                        </div>
                      </button>

                      <div className="mt-3 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditCategory(category)}
                          aria-label={`Edit category ${category.name}`}
                          className="rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(category)}
                          aria-label={`Delete category ${category.name}`}
                          className="rounded-lg px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </aside>

          <div className="space-y-4">
            {!activeCategory ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
                Select a category to manage its replies.
              </div>
            ) : (
              <>
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{activeCategory.icon || '🗂️'}</span>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-slate-900">{activeCategory.name}</h3>
                          <div className="mt-1 font-mono text-xs text-slate-500">{activeCategory.id}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                        {activeCategory.replies.length} replies
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddReply(activeCategory)}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                      >
                        Add Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditCategory(activeCategory)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        Edit Category
                      </button>
                    </div>
                  </div>
                </section>

                {activeReplies.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
                    No replies in this category yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeReplies.map(reply => (
                      <article key={reply.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold text-slate-800">{reply.title}</h4>
                            <div className="mt-1 font-mono text-[11px] text-slate-500">{reply.id}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditReply(activeCategory, reply)}
                              aria-label={`Edit reply ${reply.title}`}
                              className="rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteReply(activeCategory, reply)}
                              aria-label={`Delete reply ${reply.title}`}
                              className="rounded-lg px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {reply.keywords.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {reply.keywords.map(keyword => (
                              <span key={keyword} className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 grid gap-3 xl:grid-cols-2">
                          <section className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-3">
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                              Polite
                            </div>
                            <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                              {reply.polite}
                            </div>
                          </section>

                          <section className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-3">
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                              Firm
                            </div>
                            <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                              {reply.firm}
                            </div>
                          </section>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
