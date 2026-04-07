import { spawn } from 'child_process'

function spawnAndWait(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { stdio: 'ignore' })

    child.once('error', rejectPromise)
    child.once('close', code => {
      if (code === 0) {
        resolvePromise()
        return
      }

      rejectPromise(new Error(`command failed: ${command}`))
    })
  })
}

export async function openOutlookAndCopyTitle(title) {
  const normalizedTitle = title?.trim() ?? ''
  if (!normalizedTitle) throw new Error('title required')

  if (process.env.NODE_ENV === 'test') {
    return { title: normalizedTitle, action: 'open-outlook' }
  }

  if (process.platform === 'darwin') {
    const script = [
      'on run argv',
      '  set searchTitle to item 1 of argv',
      '  set the clipboard to searchTitle',
      '  tell application "Microsoft Outlook" to activate',
      'end run'
    ]
    const args = script.flatMap(line => ['-e', line])
    args.push(normalizedTitle)

    await spawnAndWait('osascript', args)
    return { title: normalizedTitle, action: 'open-outlook' }
  }

  throw new Error('outlook shortcut unavailable')
}
