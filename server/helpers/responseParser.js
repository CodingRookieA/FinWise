export function parseAIResponse(raw) {
    // Always operate on a safe string so parsing never throws on bad input types.
    const safeRaw = typeof raw === 'string' ? raw : ''

    // Detect top-level block headers regardless of capitalization.
    const headerRegex = /(?:^|\n)\s*(RECOMMENDATIONS|SOURCES)\s*:/ig

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
        const openBraceIndex = text.indexOf('{', searchStart)
        if (openBraceIndex < 0) {
            return null
        }

        // Extract one complete JSON object by balancing braces while respecting quoted strings.
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
                    return text.slice(openBraceIndex, i + 1)
                }
            }
        }

        return null
    }

    let firstBlockIndex = -1
    let headerMatch
    // Message text is everything before the first structured block header.
    while ((headerMatch = headerRegex.exec(safeRaw)) !== null) {
        if (firstBlockIndex === -1 || headerMatch.index < firstBlockIndex) {
            firstBlockIndex = headerMatch.index
        }
    }

    const message = firstBlockIndex >= 0
        ? safeRaw.slice(0, firstBlockIndex).trim()
        : safeRaw.trim()

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

    // Parse SOURCES block if present and valid JSON object.
    const sourcesJsonText = extractJsonObjectAfterHeader(safeRaw, 'SOURCES')
    if (sourcesJsonText) {
        try {
            const parsed = JSON.parse(sourcesJsonText.trim())
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                sources = parsed
            }
        } catch {
            sources = null
        }
    }

    return {
        message,
        recommendations,
        sources,
    }
}
