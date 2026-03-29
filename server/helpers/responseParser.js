/**
 * Removes debug lines and inline source markers the model may still emit despite prompt rules.
 * Applied to the user-visible portion only (before RECOMMENDATIONS:/SOURCES: blocks).
 */
export function sanitizeAssistantVisibleText(text) {
    if (typeof text !== 'string' || text.length === 0) {
        return typeof text === 'string' ? text : ''
    }

    let s = text

    // [Internal Note: ...] — do not strip following newlines (only spaces/tabs after ])
    s = s.replace(/\[\s*Internal Note:[\s\S]*?\][ \t]*/gi, '')

    // Parenthetical (SOURCES: 1, 2, 3) or (SOURCE: 5)
    s = s.replace(/\(\s*SOURCES?\s*:\s*[\d\s,;\u2013\u2014\-–]+\)/gi, '')

    // (Source 4) or (Source 4, Source 7) — common LLM habit; not the structured SOURCES block
    s = s.replace(/\(\s*(?:Source\s+\d+(?:\s*,\s*Source\s+\d+)*)\s*\)/gi, '')

    // Bracket form [Source N] occasionally leaked into prose
    s = s.replace(/\[\s*Source\s+\d+\s*\]/gi, '')

    // Tidy whitespace after removals
    s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

    return s
}

export function parseAIResponse(raw) {
    // Always operate on a safe string so parsing never throws on bad input types.
    const safeRaw = typeof raw === 'string' ? raw : ''

    // Detect top-level block headers regardless of capitalization.
    const headerRegex = /(?:^|\n)\s*(RECOMMENDATIONS|SOURCES)\s*:/ig

    /**
     * Extract balanced `{ ... }` starting at first `{` at or after `fromIndex`.
     * @returns {{ slice: string, endIndex: number } | null}
     */
    function extractBalancedJsonSlice(text, fromIndex) {
        const openBraceIndex = text.indexOf('{', fromIndex)
        if (openBraceIndex < 0) {
            return null
        }

        let depth = 0
        let inString = false
        let escaped = false

        for (let i = openBraceIndex; i < text.length; i += 1) {
            const ch = text[i]

            if (inString) {
                if (escaped) {
                    escaped = false
                    continue
                }
                if (ch === '\\') {
                    escaped = true
                    continue
                }
                if (ch === '"') {
                    inString = false
                }
                continue
            }

            if (ch === '"') {
                inString = true
                continue
            }

            if (ch === '{') {
                depth += 1
                continue
            }

            if (ch === '}') {
                depth -= 1
                if (depth === 0) {
                    return { slice: text.slice(openBraceIndex, i + 1), endIndex: i + 1 }
                }
            }
        }

        return null
    }

    function extractJsonObjectAfterHeader(text, headerName) {
        // Find the requested header first (e.g., RECOMMENDATIONS:).
        const headerPattern = new RegExp(`(?:^|\\n)\\s*${headerName}\\s*:`, 'i')
        const headerMatch = text.match(headerPattern)
        if (!headerMatch) {
            return null
        }

        const headerIndex = headerMatch.index ?? -1
        if (headerIndex < 0) {
            return null
        }

        const searchStart = headerIndex + headerMatch[0].length
        const balanced = extractBalancedJsonSlice(text, searchStart)
        return balanced ? balanced.slice : null
    }

    /**
     * Models sometimes emit several `{ ... }` after SOURCES:. Merge all valid objects.
     */
    function extractMergedSourcesObjects(text) {
        const headerPattern = /(?:^|\n)\s*SOURCES\s*:/i
        const headerMatch = text.match(headerPattern)
        if (!headerMatch) {
            return null
        }

        const searchStart = headerMatch.index + headerMatch[0].length
        const merged = {}
        let pos = searchStart

        while (pos < text.length) {
            while (pos < text.length && /\s/.test(text[pos])) {
                pos += 1
            }
            if (pos >= text.length) {
                break
            }
            if (/RECOMMENDATIONS\s*:/i.test(text.slice(pos))) {
                break
            }

            const balanced = extractBalancedJsonSlice(text, pos)
            if (!balanced) {
                break
            }

            try {
                const parsed = JSON.parse(balanced.slice.trim())
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    Object.assign(merged, parsed)
                }
            } catch {
                // skip malformed fragment
            }
            pos = balanced.endIndex
        }

        return Object.keys(merged).length > 0 ? merged : null
    }

    let firstBlockIndex = -1
    let headerMatch
    // Message text is everything before the first structured block header.
    while ((headerMatch = headerRegex.exec(safeRaw)) !== null) {
        if (firstBlockIndex === -1 || headerMatch.index < firstBlockIndex) {
            firstBlockIndex = headerMatch.index
        }
    }

    let message = firstBlockIndex >= 0
        ? safeRaw.slice(0, firstBlockIndex).trim()
        : safeRaw.trim()

    message = sanitizeAssistantVisibleText(message)

    let recommendations = null
    let sources = null

    // Parse RECOMMENDATIONS block if present and valid JSON object.
    const recJsonText = extractJsonObjectAfterHeader(safeRaw, 'RECOMMENDATIONS')
    if (recJsonText) {
        try {
            const parsed = JSON.parse(recJsonText.trim())
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                recommendations = parsed
            }
        } catch {
            recommendations = null
        }
    }

    // Parse SOURCES: one or more JSON objects (merged); keys must be chunk ObjectIds for enrichment.
    sources = extractMergedSourcesObjects(safeRaw)

    // Backward-compatibility: parse legacy line format
    // [Sources: <url1> | <url2> | Context: ...]
    if (!sources) {
        const legacySourcesMatch = safeRaw.match(/\[\s*Sources\s*:\s*([\s\S]*?)\]/i)
        if (legacySourcesMatch && legacySourcesMatch[1]) {
            const payload = legacySourcesMatch[1]
            const beforeContext = payload.split(/\|\s*Context\s*:/i)[0]
            const urls = beforeContext
                .split('|')
                .map((item) => item.trim())
                .filter((item) => /^https?:\/\//i.test(item))

            if (urls.length > 0) {
                // Legacy format does not provide chunk ids/indexes; keep stable object shape.
                sources = Object.fromEntries(urls.map((url, idx) => [url, idx]))
            }
        }
    }

    return {
        message,
        recommendations,
        sources,
    }
}
