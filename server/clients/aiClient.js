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

    // DEBUG: Log what we're sending
    console.log('[aiClient] Conversation history after filtering:')
    console.log(`  Input history length: ${conversationHistory.length}`)
    console.log(`  Normalized history length: ${normalizedHistory.length}`)
    normalizedHistory.forEach((msg, i) => {
        console.log(`    ${i}. Role: ${msg.role}, Content preview: ${msg.parts[0].text?.substring(0, 80)}...`)
    })

    // For gemma-3-27b-it, prepend system prompt to the first user message
    const combinedUserPrompt = systemPrompt 
        ? `${systemPrompt}\n\n---\n\n${userPrompt}`
        : userPrompt

    console.log('[aiClient] Building request body with:')
    console.log(`  System prompt length: ${systemPrompt?.length || 0}`)
    console.log(`  User prompt length: ${userPrompt?.length || 0}`)
    console.log(`  History messages: ${normalizedHistory.length}`)
    console.log(`  Total contents array length: ${normalizedHistory.length + 1}`)

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
