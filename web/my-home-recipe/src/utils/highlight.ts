// ============================================================
// 文本关键词高亮工具（纯函数，无副作用）
// ------------------------------------------------------------
// 将文本按关键词切分为若干片段，命中片段标记 hit=true，
// 由模板渲染为 <mark>。避免使用 v-html，防止 XSS。
// ============================================================

export interface HighlightPart {
  text: string
  hit: boolean
}

/**
 * 把文本按关键词（不区分大小写，全部命中）拆分为高亮片段。
 * 无关键词或没有命中时返回原文本单片段，便于模板统一渲染。
 */
export function splitHighlight(text: string, keyword: string): HighlightPart[] {
  const kw = keyword.trim()
  if (!kw || !text) return [{ text, hit: false }]

  const lowerText = text.toLowerCase()
  const lowerKw = kw.toLowerCase()
  const parts: HighlightPart[] = []
  let cursor = 0

  for (;;) {
    const index = lowerText.indexOf(lowerKw, cursor)
    if (index === -1) break
    if (index > cursor) {
      parts.push({ text: text.slice(cursor, index), hit: false })
    }
    parts.push({ text: text.slice(index, index + kw.length), hit: true })
    cursor = index + kw.length
  }

  // 没有任何命中：直接返回原文，模板无需特殊处理
  if (cursor === 0) return [{ text, hit: false }]
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), hit: false })
  }
  return parts
}
