export const DEFAULT_STORY_MVP = 'Current MVP'

export function normalizeStoryMvp(mvp) {
  const trimmed = mvp?.trim()
  return trimmed || DEFAULT_STORY_MVP
}

export function normalizeStory(story) {
  return {
    ...story,
    mvp: normalizeStoryMvp(story?.mvp),
    folder: typeof story?.folder === 'string' ? story.folder.trim() : '',
    description: typeof story?.description === 'string' ? story.description.trim() : ''
  }
}

export function compareStoryGroups(left, right) {
  const rankDiff = right.lastUpdated - left.lastUpdated
  if (rankDiff !== 0) return rankDiff

  return left.name.localeCompare(right.name)
}
