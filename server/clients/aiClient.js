export async function generateAIResponse({
    systemPrompt,
    userPrompt,
    conversationHistory = [],
    apiUrl,
    apiKey,
    maxOutputTokens,
    temperature,
}) {
    const normalizedHistory = Array.isArray(conversationHistory)
        ? conversationHistory
            .filter((msg) => msg && (msg.role === 'user' || msg.role === 'model'))
            .filter((msg) => typeof msg.content === 'string' && msg.content.trim().length > 0)
            .map((msg) => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            }))
        : []

    // For gemma-3-27b-it, prepend system prompt to the first user message
    const combinedUserPrompt = systemPrompt 
        ? `${systemPrompt}\n\n---\n\n${userPrompt}`
        : userPrompt

    const response = await fetch(
        `${apiUrl}?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
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
            })
        }
    )

    if (!response.ok) {
        const error = await response.json()
        throw new Error(`AI API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
}
