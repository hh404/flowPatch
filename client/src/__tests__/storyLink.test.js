import { describe, expect, it } from 'vitest'
import { getStoryLinkDisplay, getStoryLinkFullText, isLocalStoryLink } from '../utils/storyLink.js'

describe('storyLink', () => {
  it('detects local filesystem paths', () => {
    expect(isLocalStoryLink('/Users/hans/mockups/demo.html')).toBe(true)
    expect(isLocalStoryLink('~/Desktop/spec.pdf')).toBe(true)
    expect(isLocalStoryLink('./drafts/idea.md')).toBe(true)
    expect(isLocalStoryLink('file:///Users/hans/mockups/demo.html')).toBe(true)
    expect(isLocalStoryLink('https://dev.azure.com/example/story-1')).toBe(false)
  })

  it('renders local paths from the file name instead of the root', () => {
    expect(getStoryLinkDisplay('file:///Users/hans/mockups/demo%20v2.html')).toBe('demo v2.html')
    expect(getStoryLinkDisplay('/Users/hans/Documents/review.md')).toBe('review.md')
  })

  it('keeps the full path available for tooltips and actions', () => {
    expect(getStoryLinkFullText('file:///Users/hans/mockups/demo%20v2.html')).toBe('/Users/hans/mockups/demo v2.html')
  })
})
