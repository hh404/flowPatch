import { getStoryLinkDisplay, isLocalStoryLink } from './storyLink.js'

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g
const PLAIN_LINK_PATTERN = /(https?:\/\/[^\s]+|file:\/\/[^\s]+|(?:~\/|\.\/|\.\.\/|\/|[A-Za-z]:[\\/])\S+)/g

function createLinkSegment(label, target, explicitLabel = true) {
  const trimmedTarget = target.trim()
  const trimmedLabel = label.trim()
  const local = isLocalStoryLink(trimmedTarget)

  return {
    type: 'link',
    label: explicitLabel
      ? (trimmedLabel || getStoryLinkDisplay(trimmedTarget))
      : (local ? getStoryLinkDisplay(trimmedTarget) : (trimmedLabel || trimmedTarget)),
    target: trimmedTarget,
    local
  }
}

function splitPlainLinks(text) {
  if (!text) return []

  const segments = []
  let lastIndex = 0

  for (const match of text.matchAll(PLAIN_LINK_PATTERN)) {
    const [raw] = match
    const index = match.index ?? 0

    if (index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, index) })
    }

    segments.push(createLinkSegment(raw, raw, false))
    lastIndex = index + raw.length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return segments
}

function parseLine(line) {
  const segments = []
  let lastIndex = 0

  for (const match of line.matchAll(MARKDOWN_LINK_PATTERN)) {
    const [raw, label, target] = match
    const index = match.index ?? 0

    if (index > lastIndex) {
      segments.push(...splitPlainLinks(line.slice(lastIndex, index)))
    }

    segments.push(createLinkSegment(label, target, true))
    lastIndex = index + raw.length
  }

  if (lastIndex < line.length) {
    segments.push(...splitPlainLinks(line.slice(lastIndex)))
  }

  return segments
}

export function normalizeStoryDescription(description) {
  return typeof description === 'string' ? description.trim() : ''
}

export function parseStoryDescription(description) {
  const normalized = normalizeStoryDescription(description)
  if (!normalized) return []

  return normalized.split('\n').map(line => parseLine(line))
}
