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
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        let boundary = buffer.indexOf('\n\n')
        while (boundary >= 0) {
            const eventBlock = buffer.slice(0, boundary)
            buffer = buffer.slice(boundary + 2)

            const lines = eventBlock.split(/\r?\n/)
            const dataLines = lines
                .filter((line) => line.startsWith('data:'))
                .map((line) => line.slice(5).trim())

            if (dataLines.length > 0) {
                const payload = dataLines.join('\n')
                if (payload !== '[DONE]') {
                    try {
                        const json = JSON.parse(payload)
                        const chunkText = json?.candidates?.[0]?.content?.parts?.[0]?.text
                        if (typeof chunkText === 'string' && chunkText.length > 0) {
                            yield chunkText
                        }
                    } catch {
                        // Ignore malformed chunk; continue streaming.
                    }
                }
            }

            boundary = buffer.indexOf('\n\n')
        }
    }
}
