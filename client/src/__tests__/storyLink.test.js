import { describe, expect, it } from 'vitest'
import { findTailTruncatedText, getStoryLinkDisplay, getStoryLinkFullText, isLocalStoryLink } from '../utils/storyLink.js'

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

  it('renders remote urls from the tail of the path instead of the protocol prefix', () => {
    expect(getStoryLinkDisplay('https://dev.azure.com/example/project/_workitems/edit/123456')).toBe('dev.azure.com/example/project/_workitems/edit/123456')
    expect(getStoryLinkDisplay('https://www.baidu.com/xxxxx/xx/123456')).toBe('www.baidu.com/xxxxx/xx/123456')
  })

  it('keeps the full path available for tooltips and actions', () => {
    expect(getStoryLinkFullText('file:///Users/hans/mockups/demo%20v2.html')).toBe('/Users/hans/mockups/demo v2.html')
  })

  it('truncates from the left when only the tail fits', () => {
    const text = 'translate.google.com/?sl=en&tl=zh-CN&text=hang%20up&op=translate'
    const fitted = findTailTruncatedText(text, candidate => candidate.length <= 28)

    expect(fitted).toContain('hang%20up&op=translate')
    expect(fitted.startsWith('...')).toBe(true)
  })
})
