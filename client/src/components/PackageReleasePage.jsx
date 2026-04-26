import { useMemo, useState } from 'react'

const CHECKLIST_SECTIONS = [
  {
    title: '出包前',
    items: [
      ['branchCorrect', '确认当前 branch 正确'],
      ['ticketScope', '确认 story / ticket 范围'],
      ['buildMatchesTicket', '确认 build number 与 ADO ticket 对应'],
      ['appVersionRequirement', '确认 App Version 是否有特殊要求'],
      ['buildVersionShared', 'Build 开始前已在 group share App Version'],
      ['testFlightUploaded', 'TestFlight 上确认包已上传成功'],
      ['testFlightScreenshot', 'App Store Connect / TestFlight 截图已留存']
    ]
  },
  {
    title: 'Teams / QA',
    items: [
      ['teamsSent', '已发送 Teams 通知'],
      ['qaMentioned', '已 @正确的 QA 负责人'],
      ['teamsBuildNumber', '包含 build number'],
      ['teamsStoryList', '包含 story 列表'],
      ['teamsScreenshot', '包含 TestFlight 截图'],
      ['teamsReceiptLine', '已加确认收到的要求']
    ]
  },
  {
    title: 'Confluence / ADO / Email',
    items: [
      ['confluenceUpdated', '已更新 Confluence package 记录'],
      ['confluenceFields', 'Confluence 包含日期 / build / story / 出包人'],
      ['adoCommentsUpdated', '每个相关 ADO ticket 都已更新 comment'],
      ['adoCommentFields', 'ADO comment 包含 build / 时间 / 截图'],
      ['emailSent', '已发送邮件通知'],
      ['emailRecipients', '收件人包含 QA / PO / BFF / SL'],
      ['emailScreenshot', '邮件附上 TestFlight 截图'],
      ['emailSubjectFormat', '标题符合邮件标题规范']
    ]
  },
  {
    title: '出包后跟进',
    items: [
      ['qaConfirmed', 'QA 已回复确认收到'],
      ['noReplyLogged', '若 QA 无回复，已在 Confluence 记录']
    ]
  }
]

const EMPTY_FORM = {
  market: 'SG',
  project: 'WISE',
  stage: 'SIT',
  mvp: '',
  appVersion: '',
  buildNumber: '',
  branch: '',
  packageDate: '',
  qaOwner: '',
  testFlightScreenshot: '',
  storiesText: ''
}

function getInitialChecklist() {
  return Object.fromEntries(
    CHECKLIST_SECTIONS.flatMap(section => section.items).map(([key]) => [key, false])
  )
}

function nowForInput() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function splitStories(value) {
  return value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
}

function buildNotes(release) {
  const titlePrefix = `[${release.market}][${release.project}] ${release.stage}`
  const stories = release.stories.map(story => `- ${story}`).join('\n')
  const date = release.packageDate ? formatDateTime(release.packageDate) : 'YYYY-MM-DD HH:MM SGT'
  const appVersion = release.appVersion || '23.0.0'

  return {
    buildStartMessage: `Starting build with version ${appVersion}.\n\nPlease confirm if different version is needed.\n\nBuild in progress.\n\nWill update if any review is triggered.`,
    teamsMessage: `Hi @${release.qaOwner || 'QA'},\n\n${titlePrefix} package is ready on TestFlight.\n\nVersion: ${appVersion}\nBuild: ${release.buildNumber || 'XXXXX'}\nStories:\n${stories || '- ADO#XXXX Story 标题'}\n\nTestFlight screenshot: ${release.testFlightScreenshot || '[截图或链接]'}\n\nPlease reply to confirm receipt. Thanks.`,
    adoComment: `${release.stage} Package ready.\nVersion: ${appVersion}\nBuild: ${release.buildNumber || 'XXXXX'}\nDate: ${date}\nNotified: QA via Teams + Email\nTestFlight: ${release.testFlightScreenshot || '[截图]'}`,
    emailSubject: `[${release.market}][${release.project}] ${release.stage} · Package${release.mvp ? ` | ${release.mvp}` : ''} · ${release.packageDate ? release.packageDate.slice(0, 10) : 'YYYY-MM-DD'}`,
    emailBody: `Hi team,\n\n${release.project} ${release.stage} package is available on TestFlight.\n\nVersion: ${appVersion}\nBuild: ${release.buildNumber || 'XXXXX'}\nDate: ${date}\nStories:\n${stories || '- [ADO ticket] Story 标题'}\n\nTestFlight screenshot: ${release.testFlightScreenshot || '[截图附件]'}\n\nPlease reach out if any issues.\n\nHans`,
    confluenceRow: `| ${release.packageDate ? release.packageDate.slice(0, 10) : 'YYYY-MM-DD'} | ${appVersion} | ${release.buildNumber || 'XXXXX'} | ${release.stories.join(', ') || 'ADO#'} | ${release.stage || 'SIT'} | Teams + Email | Pending |`
  }
}

function buildPayload(form, checklist) {
  const release = {
    market: form.market.trim(),
    project: form.project.trim(),
    stage: form.stage.trim(),
    mvp: form.mvp.trim(),
    appVersion: form.appVersion.trim(),
    buildNumber: form.buildNumber.trim(),
    branch: form.branch.trim(),
    packageDate: form.packageDate,
    qaOwner: form.qaOwner.trim(),
    testFlightScreenshot: form.testFlightScreenshot.trim(),
    stories: splitStories(form.storiesText)
  }

  return {
    release,
    checklist,
    notes: buildNotes(release),
    qaConfirmed: Boolean(checklist.qaConfirmed)
  }
}

function TextInput({ label, value, onChange, placeholder = '', type = 'text', required = false }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  )
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)

  async function copyValue() {
    await navigator.clipboard?.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      type="button"
      onClick={copyValue}
      className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
    >
      {copied ? 'Copied' : label}
    </button>
  )
}

export default function PackageReleasePage({
  currentPage,
  onNavigate,
  ShellHeader,
  packageReleases,
  addPackageRelease,
  updatePackageRelease,
  deletePackageRelease
}) {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, packageDate: nowForInput() }))
  const [checklist, setChecklist] = useState(getInitialChecklist)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const completedCount = Object.values(checklist).filter(Boolean).length
  const totalCount = Object.keys(checklist).length
  const payload = useMemo(() => buildPayload(form, checklist), [form, checklist])
  const sortedReleases = [...packageReleases].sort((left, right) => (
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  ))
  const selectedRecord = sortedReleases.find(item => item.id === selectedId) ?? sortedReleases[0] ?? null
  const jsonPreview = JSON.stringify(selectedRecord ?? payload, null, 2)

  function setField(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function toggleChecklist(key) {
    setChecklist(current => ({ ...current, [key]: !current[key] }))
  }

  function resetDraft() {
    setForm({ ...EMPTY_FORM, packageDate: nowForInput() })
    setChecklist(getInitialChecklist())
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const created = await addPackageRelease(payload)
      setSelectedId(created.id)
      resetDraft()
    } catch (err) {
      setError(err.message || '保存失败')
    }
  }

  async function toggleQaConfirmed(record) {
    const qaConfirmed = !record.qaConfirmed
    await updatePackageRelease(record.id, {
      ...record,
      qaConfirmed,
      checklist: {
        ...record.checklist,
        qaConfirmed
      }
    })
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 font-sans text-slate-100">
      <ShellHeader
        currentPage={currentPage}
        onNavigate={onNavigate}
        summary={[
          { label: `Packages ${packageReleases.length}` },
          { label: `Checklist ${completedCount}/${totalCount}` },
          { label: `This JSON ${payload.release.buildNumber || 'Draft'}` }
        ]}
      />

      <main className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <form onSubmit={handleSubmit} className="overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/30">
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/95 px-4 py-3 backdrop-blur">
            <div>
              <h1 className="text-lg font-semibold text-white">Package SOP</h1>
              <p className="mt-1 text-xs text-zinc-400">Checklist to one saved JSON record per package.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetDraft}
                className="h-9 rounded-lg border border-zinc-700 px-3 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800"
              >
                Reset
              </button>
              <button
                type="submit"
                className="h-9 rounded-lg bg-emerald-400 px-4 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                Save JSON
              </button>
            </div>
          </div>

          <div className="space-y-4 p-4">
            {error && (
              <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </div>
            )}

            <section className="rounded-lg border border-zinc-800 bg-white p-4 text-slate-900">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <TextInput label="Market" value={form.market} required onChange={value => setField('market', value)} />
                <TextInput label="Project" value={form.project} required onChange={value => setField('project', value)} />
                <TextInput label="Stage" value={form.stage} required onChange={value => setField('stage', value)} />
                <TextInput label="MVP" value={form.mvp} placeholder="MVPX" onChange={value => setField('mvp', value)} />
                <TextInput label="App Version" value={form.appVersion} placeholder="23.0.0" onChange={value => setField('appVersion', value)} />
                <TextInput label="Build" value={form.buildNumber} required placeholder="XXXXX" onChange={value => setField('buildNumber', value)} />
                <TextInput label="Branch" value={form.branch} placeholder="release/..." onChange={value => setField('branch', value)} />
                <TextInput label="Package Time" type="datetime-local" value={form.packageDate} onChange={value => setField('packageDate', value)} />
                <TextInput label="QA Owner" value={form.qaOwner} placeholder="QA name" onChange={value => setField('qaOwner', value)} />
                <TextInput label="Screenshot" value={form.testFlightScreenshot} placeholder="link or filename" onChange={value => setField('testFlightScreenshot', value)} />
              </div>

              <label className="mt-3 flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                Stories / ADO Tickets
                <textarea
                  value={form.storiesText}
                  required
                  rows={5}
                  placeholder={'ADO#1234 Story title\nADO#1235 Story title'}
                  onChange={event => setField('storiesText', event.target.value)}
                  className="resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              {CHECKLIST_SECTIONS.map(section => (
                <div key={section.title} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <h2 className="text-sm font-semibold text-white">{section.title}</h2>
                  <div className="mt-3 space-y-2">
                    {section.items.map(([key, label]) => (
                      <label
                        key={key}
                        className="flex min-h-10 items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:border-zinc-700"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(checklist[key])}
                          onChange={() => toggleChecklist(key)}
                          className="h-4 w-4 rounded border-zinc-600 text-emerald-400 focus:ring-emerald-300"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="grid gap-3 lg:grid-cols-2">
              {[
                ['Build Start', payload.notes.buildStartMessage],
                ['Teams', payload.notes.teamsMessage],
                ['ADO', payload.notes.adoComment],
                ['Email Subject', payload.notes.emailSubject],
                ['Confluence', payload.notes.confluenceRow]
              ].map(([title, value]) => (
                <div key={title} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h2>
                    <CopyButton value={value} label="Copy" />
                  </div>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-black p-3 font-mono text-xs leading-5 text-emerald-100">
                    {value}
                  </pre>
                </div>
              ))}
            </section>
          </div>
        </form>

        <aside className="grid min-h-0 grid-rows-[minmax(220px,0.55fr)_minmax(240px,0.45fr)] gap-4">
          <section className="min-h-0 overflow-auto rounded-lg border border-zinc-800 bg-zinc-900">
            <div className="sticky top-0 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Package Records</h2>
            </div>
            <div className="space-y-2 p-3">
              {sortedReleases.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-700 p-4 text-sm text-zinc-400">
                  还没有记录。保存一次出包后，这里会出现一条 JSON。
                </div>
              )}
              {sortedReleases.map(record => {
                const isSelected = selectedRecord?.id === record.id
                const done = Object.values(record.checklist ?? {}).filter(Boolean).length

                return (
                  <article
                    key={record.id}
                    className={`rounded-lg border p-3 transition ${
                      isSelected ? 'border-emerald-400 bg-emerald-400/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(record.id)}
                      className="block w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-white">
                            {record.release.market} {record.release.project} {record.release.stage}
                          </h3>
                          <p className="mt-1 font-mono text-xs text-emerald-200">Build {record.release.buildNumber}</p>
                        </div>
                        <span className="rounded-full bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300">
                          {done}/{totalCount}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-zinc-400">
                        {record.release.stories?.join(', ')}
                      </p>
                      <p className="mt-2 text-[11px] text-zinc-500">{formatDateTime(record.createdAt)}</p>
                    </button>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleQaConfirmed(record)}
                        className={`h-8 rounded-lg px-3 text-xs font-medium transition ${
                          record.qaConfirmed
                            ? 'bg-emerald-400 text-zinc-950'
                            : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {record.qaConfirmed ? 'QA Confirmed' : 'Mark QA Confirmed'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePackageRelease(record.id)}
                        className="h-8 rounded-lg border border-rose-400/40 px-3 text-xs font-medium text-rose-100 transition hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="min-h-0 rounded-lg border border-zinc-800 bg-black">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">JSON</h2>
              <CopyButton value={jsonPreview} label="Copy JSON" />
            </div>
            <pre className="h-full overflow-auto p-4 font-mono text-xs leading-5 text-emerald-100">
              {jsonPreview}
            </pre>
          </section>
        </aside>
      </main>
    </div>
  )
}
