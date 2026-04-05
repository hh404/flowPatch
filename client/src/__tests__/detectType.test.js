import { describe, it, expect } from 'vitest'
import { detectType } from '../utils/detectType.js'

describe('detectType', () => {
  it('returns waiting for "wait" prefix', () => expect(detectType('wait pipeline')).toBe('waiting'))
  it('returns waiting for "waiting" prefix', () => expect(detectType('waiting for john')).toBe('waiting'))
  it('returns followup for "ask" prefix', () => expect(detectType('ask John about API')).toBe('followup'))
  it('returns followup for "follow" prefix', () => expect(detectType('follow up on PR')).toBe('followup'))
  it('returns followup for "check" prefix', () => expect(detectType('check deploy status')).toBe('followup'))
  it('returns shadow for "shadow" prefix', () => expect(detectType('shadow: help team B')).toBe('shadow'))
  it('returns ad-hoc for "adhoc" prefix', () => expect(detectType('adhoc: fix typo')).toBe('ad-hoc'))
  it('returns ad-hoc for "ad-hoc" prefix', () => expect(detectType('ad-hoc fix typo')).toBe('ad-hoc'))
  it('returns todo as default', () => expect(detectType('review PR')).toBe('todo'))
  it('is case-insensitive', () => expect(detectType('WAIT for build')).toBe('waiting'))
})
