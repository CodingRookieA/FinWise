/**
 * classifier.js
 * Classifies user queries to determine what data sources are needed
 * to answer the question (articles, fund data, or both)
 * 
 * Uses Gemma 2 27B model for classification
 */

import { ENVIRONMENT } from '../utils/constants.js'

const CLASSIFICATION_PROMPT = `You are a query classifier for a financial guidance assistant focused on mutual funds.

Your task: Analyze the user's query and determine what data sources are needed to answer it.

Data sources available:
1. **Articles** - Educational content about mutual fund concepts (what is NAV, how funds work, RRSP/TFSA info, investment strategies, fees, taxes, etc.)
2. **Funds** - Specific mutual fund data (fund names, performance, holdings, fund codes, ratings, etc.)

Classification rules:
- Set "needs_articles" to true if the query asks about concepts, definitions, how-to, strategies, or general education
- Set "needs_funds" to true if the query asks about specific funds, fund performance, fund recommendations, or fund comparisons
- Both can be true if the query needs both conceptual explanation AND specific fund data
- Both can be false only if the query is off-topic (not about investing/mutual funds)

Examples:
- "What is a mutual fund?" → needs_articles: true, needs_funds: false
- "Show me the top performing Canadian equity funds" → needs_articles: false, needs_funds: true
- "How do RRSP contribution limits work?" → needs_articles: true, needs_funds: false
- "What are some good balanced funds and how do they work?" → needs_articles: true, needs_funds: true
- "Compare the fees of fund ABC123 vs DEF456" → needs_articles: false, needs_funds: true
- "What's the weather today?" → needs_articles: false, needs_funds: false

Respond ONLY with valid JSON in this exact format:
{
  "needs_articles": true or false,
  "needs_funds": true or false
}`

/**
 * Classifies a user query to determine what data sources are needed
 * 
 * @param {string} userQuery - The user's question or input
 * @returns {Promise<{needs_articles: boolean, needs_funds: boolean}>} Classification result
 */
export async function classifyQuery(userQuery) {
    if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
        throw new Error('Invalid query: must be a non-empty string')
    }

    try {
        const response = await fetch(
            `${ENVIRONMENT.aiGeneralUrl}?key=${ENVIRONMENT.aiGeneralApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { text: `${CLASSIFICATION_PROMPT}\n\nUser query: "${userQuery}"` }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.1,  // Low temperature for consistent classification
                        maxOutputTokens: 100
                    }
                })
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`AI API error: ${JSON.stringify(error)}`)
        }

        const data = await response.json()
        
        // Extract text from AI response structure
        let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (!textResponse) {
            throw new Error('Invalid response structure from AI API')
        }

        // Log raw response for debugging
        console.log(`   🤖 Raw AI response: ${textResponse}`)

        // Clean up the response - remove markdown code blocks if present
        textResponse = textResponse.trim()
        
        // Remove ```json and ``` wrappers if present
        if (textResponse.startsWith('```json')) {
            textResponse = textResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '')
        } else if (textResponse.startsWith('```')) {
            textResponse = textResponse.replace(/^```\s*/, '').replace(/```\s*$/, '')
        }
        
        console.log(`   🤖 Cleaned AI response: ${textResponse}`)
        // Try to extract JSON object if there's extra text
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            textResponse = jsonMatch[0]
        }

        // Parse JSON response
        const classification = JSON.parse(textResponse)
        
        // Validate response structure
        if (
            typeof classification.needs_articles !== 'boolean' ||
            typeof classification.needs_funds !== 'boolean'
        ) {
            throw new Error('Invalid classification response: missing or invalid boolean fields')
        }

        console.log(`📊 Query classified: articles=${classification.needs_articles}, funds=${classification.needs_funds}`)
        
        return classification

    } catch (error) {
        console.error('Classification error:', error.message)
        
        // Fallback: assume both sources might be needed on error
        return {
            needs_articles: true,
            needs_funds: true
        }
    }
}
