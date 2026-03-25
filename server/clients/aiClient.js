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

function findEventBoundary(text) {
    // SSE event blocks may be delimited by LF or CRLF blank lines depending on proxy/provider.
    // Support both so streaming parsing is robust across environments.
    const lfBoundary = text.indexOf('\n\n')
    const crlfBoundary = text.indexOf('\r\n\r\n')

    if (lfBoundary === -1 && crlfBoundary === -1) return null
    if (lfBoundary === -1) return { index: crlfBoundary, length: 4 }
    if (crlfBoundary === -1) return { index: lfBoundary, length: 2 }

    return lfBoundary < crlfBoundary
        ? { index: lfBoundary, length: 2 }
        : { index: crlfBoundary, length: 4 }
}

function extractChunkTextFromSseBlock(eventBlock) {
    // SSE payloads arrive as "data: ..." lines. We only care about token text chunks.
    const lines = eventBlock.split(/\r?\n/)
    const dataLines = lines
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())

    if (dataLines.length === 0) return null

    const payload = dataLines.join('\n')
    if (payload === '[DONE]') return null

    try {
        const json = JSON.parse(payload)
        const chunkText = json?.candidates?.[0]?.content?.parts?.[0]?.text
        return (typeof chunkText === 'string' && chunkText.length > 0) ? chunkText : null
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
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) {
            // Some providers may end without a final blank-line boundary.
            // Attempt to parse any remaining block once.
            const trailing = extractChunkTextFromSseBlock(buffer)
            if (trailing) {
                yield trailing
            }
            break
        }

        buffer += decoder.decode(value, { stream: true })

        let boundaryInfo = findEventBoundary(buffer)
        while (boundaryInfo) {
            const eventBlock = buffer.slice(0, boundaryInfo.index)
            buffer = buffer.slice(boundaryInfo.index + boundaryInfo.length)

            const chunkText = extractChunkTextFromSseBlock(eventBlock)
            if (chunkText) {
                yield chunkText
            }

            boundaryInfo = findEventBoundary(buffer)
        }
    }
}
