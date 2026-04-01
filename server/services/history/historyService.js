function estimateTokens(text) {
    if (!text || typeof text !== 'string') return 0
    return Math.ceil(text.length / 4)
}

export function trimHistoryToTokenBudget(history, budget = 750, maxTurns = 20) {
    if (!Array.isArray(history) || history.length === 0) {
        return []
    }

    const maxMessages = Math.max(0, Number(maxTurns) || 0) * 2
    const tokenBudget = Math.max(0, Number(budget) || 0)

    let tokenCount = 0
    const selected = []

    for (let i = history.length - 1; i >= 0; i -= 1) {
        if (selected.length >= maxMessages) break

        const message = history[i]
        const content = message?.content
        const messageTokens = estimateTokens(content)

        if (messageTokens <= 0) {
            continue
        }

        if (tokenCount + messageTokens > tokenBudget) {
            break
        }

        selected.push(message)
        tokenCount += messageTokens
    }

    const trimmed = selected.reverse()

    console.log(
        `[historyService] kept ${trimmed.length}/${history.length} messages, ` +
        `estimated history tokens=${tokenCount}/${tokenBudget}`
    )

    return trimmed
}

export function formatHistoryForLLM(history) {
    if (!Array.isArray(history) || history.length === 0) {
        return []
    }

    return history
        .filter((msg) => typeof msg?.content === 'string' && msg.content.trim().length > 0)
        .map((msg) => {
            if (msg.role === 'AI') {
                return { role: 'model', content: msg.content }
            }
            if (msg.role === 'user') {
                return { role: 'user', content: msg.content }
            }
            return null
        })
        .filter(Boolean)
}
