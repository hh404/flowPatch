import { spawn } from 'child_process'
import { access, stat } from 'fs/promises'
import { dirname, normalize, resolve } from 'path'
import { homedir } from 'os'

const WINDOWS_ABSOLUTE_PATH = /^[A-Za-z]:[\\/]/
const LOCAL_ACTIONS = new Set(['open', 'reveal'])

export function isLocalStoryLink(link) {
  const trimmed = link?.trim() ?? ''

  return trimmed.startsWith('file://') ||
    trimmed.startsWith('~/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('/') ||
    WINDOWS_ABSOLUTE_PATH.test(trimmed)
}

export function resolveLocalStoryPath(link) {
  const trimmed = link?.trim() ?? ''
  if (!isLocalStoryLink(trimmed)) throw new Error('local path required')

  if (trimmed.startsWith('file://')) {
    let url

    try {
      url = new URL(trimmed)
    } catch {
      throw new Error('invalid file url')
    }

    let pathname = decodeURIComponent(url.pathname)

    if (WINDOWS_ABSOLUTE_PATH.test(pathname.slice(1))) {
      pathname = pathname.slice(1)
    }

    return normalize(pathname)
  }

  if (trimmed.startsWith('~/')) {
    return normalize(resolve(homedir(), trimmed.slice(2)))
  }

  if (trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return normalize(resolve(process.cwd(), trimmed))
  }

  return normalize(trimmed)
}

async function spawnAndWait(command, args) {
  await new Promise((resolvePromise, rejectPromise) => {
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

async function spawnAndCollect(command, args) {
  return await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', chunk => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', chunk => {
      stderr += chunk.toString()
    })

    child.once('error', rejectPromise)
    child.once('close', code => {
      if (code === 0) {
        resolvePromise(stdout.trim())
        return
      }

      rejectPromise(new Error(stderr.trim() || `command failed: ${command}`))
    })
  })
}

async function revealTargetForLinux(pathname) {
  const target = await stat(pathname)
  return target.isDirectory() ? pathname : dirname(pathname)
}

async function openFinderDirectoryInTab(pathname) {
  const script = [
    'on run argv',
    '  set targetFolder to POSIX file (item 1 of argv)',
    '  tell application "Finder"',
    '    set previousSetting to folders open in new tabs of Finder preferences',
    '    try',
    '      set folders open in new tabs of Finder preferences to true',
    '      activate',
    '      open targetFolder',
    '      delay 0.05',
    '      set folders open in new tabs of Finder preferences to previousSetting',
    '    on error errMsg number errNum',
    '      set folders open in new tabs of Finder preferences to previousSetting',
    '      error errMsg number errNum',
    '    end try',
    '  end tell',
    'end run'
  ]
  const args = script.flatMap(line => ['-e', line])
  args.push(pathname)
  await spawnAndWait('osascript', args)
}

export async function openLocalStoryLink(link, action = 'open') {
  if (!LOCAL_ACTIONS.has(action)) throw new Error('invalid action')

  const resolvedPath = resolveLocalStoryPath(link)
  await access(resolvedPath)

  if (process.env.NODE_ENV === 'test') {
    return { resolvedPath, action }
  }

  if (process.platform === 'darwin') {
    if (action === 'reveal') {
      await spawnAndWait('open', ['-R', resolvedPath])
      return { resolvedPath, action }
    }

    const target = await stat(resolvedPath)

    if (target.isDirectory()) {
      try {
        await openFinderDirectoryInTab(resolvedPath)
        return { resolvedPath, action }
      } catch {
        await spawnAndWait('open', [resolvedPath])
        return { resolvedPath, action }
      }
    }

    await spawnAndWait('open', [resolvedPath])
    return { resolvedPath, action }
  }

  if (process.platform === 'win32') {
    await spawnAndWait('explorer.exe', action === 'reveal' ? ['/select,', resolvedPath] : [resolvedPath])
    return { resolvedPath, action }
  }

  const target = action === 'reveal' ? await revealTargetForLinux(resolvedPath) : resolvedPath
  await spawnAndWait('xdg-open', [target])
  return { resolvedPath, action }
}

export async function selectLocalFolder(currentPath = '') {
  const trimmedCurrentPath = currentPath?.trim() ?? ''
  const normalizedCurrentPath = trimmedCurrentPath ? resolveLocalStoryPath(trimmedCurrentPath) : ''

  if (process.env.NODE_ENV === 'test') {
    const selectedPath = process.env.TEST_SELECTED_FOLDER?.trim() ?? normalizedCurrentPath
    return { path: selectedPath || '' }
  }

  if (process.platform === 'darwin') {
    const script = [
      'on run argv',
      '  try',
      '    if (count of argv) > 0 and item 1 of argv is not "" then',
      '      return POSIX path of (choose folder with prompt "Select story folder" default location (POSIX file (item 1 of argv)))',
      '    end if',
      '    return POSIX path of (choose folder with prompt "Select story folder")',
      '  on error number -128',
      '    return ""',
      '  end try',
      'end run'
    ]
    const args = script.flatMap(line => ['-e', line])

    if (normalizedCurrentPath) {
      args.push(normalizedCurrentPath)
    }

    const selectedPath = await spawnAndCollect('osascript', args)
    return { path: selectedPath ? normalize(selectedPath) : '' }
  }

  if (process.platform === 'win32') {
    const command = [
      'Add-Type -AssemblyName System.Windows.Forms',
      '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog',
      normalizedCurrentPath ? `$dialog.SelectedPath = '${normalizedCurrentPath.replace(/'/g, "''")}'` : '',
      'if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.SelectedPath }'
    ].filter(Boolean).join('; ')
    const selectedPath = await spawnAndCollect('powershell.exe', ['-NoProfile', '-Command', command])
    return { path: selectedPath ? normalize(selectedPath) : '' }
  }

  const zenityArgs = ['--file-selection', '--directory', '--title=Select story folder']
  if (normalizedCurrentPath) {
    zenityArgs.push(`--filename=${normalizedCurrentPath}/`)
  }

  try {
    const selectedPath = await spawnAndCollect('zenity', zenityArgs)
    return { path: selectedPath ? normalize(selectedPath) : '' }
  } catch (error) {
    if (error.message.includes('command failed: zenity')) {
      throw new Error('folder picker unavailable')
    }

    throw error
  }
}
