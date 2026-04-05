const rules = [
  [/^wait(ing)?\b/i, 'waiting'],
  [/^(ask|follow|check)\b/i, 'followup'],
  [/^shadow\b/i, 'shadow'],
  [/^ad-?hoc\b/i, 'ad-hoc']
]

export function detectType(title) {
  for (const [re, type] of rules) {
    if (re.test(title.trim())) return type
  }
  return 'todo'
}
