import { describe, expect, it } from 'vitest'
import { normalizeStoryDescription, parseStoryDescription } from '../utils/storyDescription.js'

describe('storyDescription', () => {
  it('normalizes empty descriptions', () => {
    expect(normalizeStoryDescription(undefined)).toBe('')
    expect(normalizeStoryDescription('  note  ')).toBe('note')
  })

  it('parses markdown and plain local links inside description text', () => {
    const lines = parseStoryDescription('Draft [mockup](/Users/hans/mockups/demo.html)\nSee also https://example.com/spec and ./notes/todo.md')

    expect(lines).toHaveLength(2)
    expect(lines[0][1]).toMatchObject({
      type: 'link',
      label: 'mockup',
      target: '/Users/hans/mockups/demo.html',
      local: true
    })
    expect(lines[1][1]).toMatchObject({
      type: 'link',
      label: 'https://example.com/spec',
      target: 'https://example.com/spec',
      local: false
    })
    expect(lines[1][3]).toMatchObject({
      type: 'link',
      label: 'todo.md',
      target: './notes/todo.md',
      local: true
    })
  })
})
