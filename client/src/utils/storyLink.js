const WINDOWS_ABSOLUTE_PATH = /^[A-Za-z]:[\\/]/

export function isLocalStoryLink(link) {
  const trimmed = link?.trim() ?? ''

  return trimmed.startsWith('file://') ||
    trimmed.startsWith('~/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('/') ||
    WINDOWS_ABSOLUTE_PATH.test(trimmed)
}

function decodeFileUrl(link) {
  const url = new URL(link)
  const pathname = decodeURIComponent(url.pathname)

  if (WINDOWS_ABSOLUTE_PATH.test(pathname.slice(1))) {
    return pathname.slice(1)
  }

  return pathname
}

export function getStoryLinkFullText(link) {
  const trimmed = link?.trim() ?? ''
  if (!trimmed.startsWith('file://')) return trimmed

  try {
    return decodeFileUrl(trimmed)
  } catch {
    return trimmed
  }
}

export function getStoryLinkDisplay(link) {
  const trimmed = link?.trim() ?? ''
  if (!isLocalStoryLink(trimmed)) return trimmed

  const fullText = getStoryLinkFullText(trimmed)
  const segments = fullText.split(/[\\/]/).filter(Boolean)

  if (segments.length === 0) return fullText
  return segments.at(-1) ?? fullText
}
