function normalizeHistory(conversationHistory = []) {
    return Array.isArray(conversationHistory)
        ? conversationHistory
            .filter((msg) => msg && (msg.role === 'user' || msg.role === 'model'))
            .filter((msg) => typeof msg.content === 'string' && msg.content.trim().length > 0)
            .map((msg) => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            }))
        : []
}

function buildRequestBody({ systemPrompt, userPrompt, normalizedHistory, maxOutputTokens, temperature }) {
    const combinedUserPrompt = systemPrompt
        ? `${systemPrompt}\n\n---\n\n${userPrompt}`
        : userPrompt

    return {
        contents: [
            ...normalizedHistory,
            {
                role: 'user',
                parts: [{ text: combinedUserPrompt }]
            }
        ],
        generationConfig: {
            maxOutputTokens,
            temperature,
        }
    }
}

/**
 * Concatenate incremental text from all Gemini content parts (some models emit multiple parts).
 */
function extractTextFromGeminiStreamJson(json) {
    const parts = json?.candidates?.[0]?.content?.parts
    if (!Array.isArray(parts)) {
        return null
    }

    let out = ''
    for (const p of parts) {
        if (typeof p?.text === 'string' && p.text.length > 0) {
            out += p.text
        }
    }

    return out.length > 0 ? out : null
}

function parseGeminiSseDataPayload(payload) {
    if (!payload || payload === '[DONE]') {
        return null
    }

    try {
        const json = JSON.parse(payload)
        return extractTextFromGeminiStreamJson(json)
    } catch {
        return null
    }
}

export async function generateAIResponse({
    systemPrompt,
    userPrompt,
    conversationHistory = [],
    apiUrl,
    apiKey,
    maxOutputTokens,
    temperature,
}) {
    const normalizedHistory = normalizeHistory(conversationHistory)

    const body = buildRequestBody({ systemPrompt, userPrompt, normalizedHistory, maxOutputTokens, temperature })

    const response = await fetch(
        `${apiUrl}?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
    )

    if (!response.ok) {
        const error = await response.json()
        throw new Error(`AI API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
}

export async function* generateAIResponseStream({
    systemPrompt,
    userPrompt,
    conversationHistory = [],
    apiUrl,
    apiKey,
    maxOutputTokens,
    temperature,
}) {
    const normalizedHistory = normalizeHistory(conversationHistory)
    const body = buildRequestBody({ systemPrompt, userPrompt, normalizedHistory, maxOutputTokens, temperature })
    // Gemini streaming endpoint uses streamGenerateContent + alt=sse.
    const streamUrl = `${apiUrl.replace(':generateContent', ':streamGenerateContent')}?alt=sse&key=${apiKey}`

    const response = await fetch(streamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`AI API stream error: ${JSON.stringify(error)}`)
    }

    if (!response.body) {
        throw new Error('AI API stream error: missing response body')
    }

    const decoder = new TextDecoder('utf-8')
    const reader = response.body.getReader()
    // Incomplete tail of the HTTP body (may end mid-line before the next read()).
    let buffer = ''
    // `data:` lines for the current SSE event (an event ends at a blank line).
    const pendingDataLines = []

    while (true) {
        const { done, value } = await reader.read()
        if (value) {
            buffer += decoder.decode(value, { stream: true })
        }
        if (done) {
            buffer += decoder.decode(new Uint8Array(), { stream: false })
        }

        let lineStart = 0
        while (lineStart < buffer.length) {
            const nl = buffer.indexOf('\n', lineStart)
            if (nl === -1) {
                break
            }

            let line = buffer.slice(lineStart, nl)
            lineStart = nl + 1
            if (line.endsWith('\r')) {
                line = line.slice(0, -1)
            }

            if (line === '') {
                if (pendingDataLines.length > 0) {
                    const payload = pendingDataLines.join('\n')
                    pendingDataLines.length = 0
                    const chunkText = parseGeminiSseDataPayload(payload)
                    if (chunkText) {
                        yield chunkText
                    }
                }
            } else if (line.startsWith('data:')) {
                pendingDataLines.push(line.slice(5).trimStart())
            }
        }

        buffer = buffer.slice(lineStart)

        if (done) {
            if (pendingDataLines.length > 0) {
                const payload = pendingDataLines.join('\n')
                pendingDataLines.length = 0
                const chunkText = parseGeminiSseDataPayload(payload)
                if (chunkText) {
                    yield chunkText
                }
            }

            const tail = buffer.trim()
            if (tail) {
                const chunkText = parseGeminiSseDataPayload(tail)
                if (chunkText) {
                    yield chunkText
                }
            }
            break
        }
    }
}
