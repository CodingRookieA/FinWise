export async function generateAIResponse({
    systemPrompt,
    userPrompt,
    apiUrl,
    apiKey,
    maxOutputTokens,
    temperature,
}) {
    const response = await fetch(
        `${apiUrl}?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: systemPrompt + '\n\n' + userPrompt }]
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
