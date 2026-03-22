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
You may receive an optional user profile summary. Use it only to disambiguate intent; do not infer new data needs unless the query itself implies it.

Data sources available:
1. **Articles** - Educational content about mutual fund concepts (what is NAV, how funds work, RRSP/TFSA info, investment strategies, fees, taxes, etc.)
2. **Funds** - Specific mutual fund data (fund names, performance, holdings, fund codes, ratings, etc.)
3. **ETFs** - Specific ETF (Exchange-Traded Fund) data (ETF names, tickers, performance, holdings, expense ratios, etc.)
4. **Distributions** - Historical distribution/payout data for mutual funds (dividends, capital gains, return of capital, foreign tax, interest, etc. by year)

Classification rules:
- Set "needs_articles" to true if the query asks about concepts, definitions, how-to, strategies, or general education
- Set "needs_funds" to true if the query asks about specific mutual funds, mutual fund performance, mutual fund recommendations, or mutual fund comparisons
- Set "needs_etfs" to true if the query mentions ETFs, asks for general investment recommendations, asks "what should I invest in", or compares investment options
- For generic recommendation intent (for example "what should I invest in", "what should I buy", "best investments for me", "give me investment advice"), set "needs_articles", "needs_funds", and "needs_etfs" to true
- Set "needs_etfs" to false if the query is specifically and only about mutual funds, articles, or non-investment topics
- Set "needs_distribution_mutual_funds" to true if the query asks about mutual fund distributions, payouts, dividends, capital gains distributions, tax breakdowns, or distribution history. This is only relevant when needs_funds is also true.
- Multiple fields can be true if the query spans multiple data sources
- All can be false only if the query is off-topic (not about investing/mutual funds/ETFs)

Examples:
- "What is a mutual fund?" → needs_articles: true, needs_funds: false, needs_etfs: false, needs_distribution_mutual_funds: false
- "Show me the top performing Canadian equity funds" → needs_articles: false, needs_funds: true, needs_etfs: false, needs_distribution_mutual_funds: false
- "How do RRSP contribution limits work?" → needs_articles: true, needs_funds: false, needs_etfs: false, needs_distribution_mutual_funds: false
- "What are some good balanced funds and how do they work?" → needs_articles: true, needs_funds: true, needs_etfs: false, needs_distribution_mutual_funds: false
- "Compare the fees of fund ABC123 vs DEF456" → needs_articles: false, needs_funds: true, needs_etfs: false, needs_distribution_mutual_funds: false
- "Show me top performing ETFs" → needs_articles: false, needs_funds: false, needs_etfs: true, needs_distribution_mutual_funds: false
- "What should I invest in?" → needs_articles: true, needs_funds: true, needs_etfs: true, needs_distribution_mutual_funds: false
- "Compare ETF XYZ with mutual fund ABC" → needs_articles: false, needs_funds: true, needs_etfs: true, needs_distribution_mutual_funds: false
- "How do ETFs differ from mutual funds?" → needs_articles: true, needs_funds: false, needs_etfs: false, needs_distribution_mutual_funds: false
- "What distributions did fund RBF565 pay last year?" → needs_articles: false, needs_funds: true, needs_etfs: false, needs_distribution_mutual_funds: true
- "Show me the capital gains history for this fund" → needs_articles: false, needs_funds: true, needs_etfs: false, needs_distribution_mutual_funds: true
- "What's the weather today?" → needs_articles: false, needs_funds: false, needs_etfs: false, needs_distribution_mutual_funds: false

Respond ONLY with valid JSON in this exact format:
{
  "needs_articles": true or false,
  "needs_funds": true or false,
    "needs_etfs": true or false,
  "needs_distribution_mutual_funds": true or false
}`

const PROFILE_FIELDS = [
    'income_stability',
    'employment_status',
    'risk_tolerance',
    'investment_experience',
    'financial_goal',
    'housing_status',
    'has_TFSA',
    'monthly_income',
    'savings_balance',
    'debt_amount'
]

function buildProfileSummary(profile) {
    if (!profile || typeof profile !== 'object') {
        return null
    }

    const summary = {}
    for (const field of PROFILE_FIELDS) {
        if (profile[field] !== null && profile[field] !== undefined && profile[field] !== '') {
            summary[field] = profile[field]
        }
    }

    return Object.keys(summary).length ? summary : null
}

function isGenericRecommendationIntent(query) {
    if (!query || typeof query !== 'string') return false
    const normalized = query.toLowerCase()
    const patterns = [
        /what should i invest in/,
        /where should i invest/,
        /what should i buy/,
        /best investments? for me/,
        /recommend(?: me)? (?:some )?investments?/,
        /investment recommendations?/,
        /investment advice/,
        /investment advices?/
    ]
    return patterns.some((pattern) => pattern.test(normalized))
}

/**
 * Classifies a user query to determine what data sources are needed
 * 
 * @param {string} userQuery - The user's question or input
 * @returns {Promise<{needs_articles: boolean, needs_funds: boolean, needs_etfs: boolean, needs_distribution_mutual_funds: boolean}>} Classification result
 */
export async function classifyQuery(userQuery, userProfile = null) {
    if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
        throw new Error('Invalid query: must be a non-empty string')
    }

    try {
        const profileSummary = buildProfileSummary(userProfile)
        const profileText = profileSummary ? JSON.stringify(profileSummary) : 'none'

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
                                { text: `${CLASSIFICATION_PROMPT}\n\nUser profile summary: ${profileText}\n\nUser query: "${userQuery}"` }
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

        if (typeof classification.needs_etfs !== 'boolean' && typeof classification.needs_ETF === 'boolean') {
            classification.needs_etfs = classification.needs_ETF
        }
        
        // Validate response structure
        if (
            typeof classification.needs_articles !== 'boolean' ||
            typeof classification.needs_funds !== 'boolean' ||
            typeof classification.needs_etfs !== 'boolean' ||
            typeof classification.needs_distribution_mutual_funds !== 'boolean'
        ) {
            throw new Error('Invalid classification response: missing or invalid boolean fields')
        }

        if (isGenericRecommendationIntent(userQuery)) {
            classification.needs_articles = true
            classification.needs_funds = true
            classification.needs_etfs = true
        }

        console.log(`📊 Query classified: articles=${classification.needs_articles}, funds=${classification.needs_funds}, etfs=${classification.needs_etfs}, distribution=${classification.needs_distribution_mutual_funds}`)
        
        return classification

    } catch (error) {
        console.error('Classification error:', error.message)
        
        // Fallback: assume all sources might be needed on error
        return {
            needs_articles: true,
            needs_funds: true,
            needs_etfs: true,
            needs_distribution_mutual_funds: false
        }
    }
}
