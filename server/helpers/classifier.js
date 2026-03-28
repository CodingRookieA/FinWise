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
You may also receive optional recent conversation history. Use it to determine whether the query is a follow-up and what topic the user is referring to.

Data sources available:
1. **Articles** - Educational content about mutual fund concepts (what is NAV, how funds work, RRSP/TFSA info, investment strategies, fees, taxes, etc.)
2. **Funds** - Specific mutual fund data (fund names, performance, holdings, fund codes, ratings, etc.)
3. **ETFs** - Specific ETF (Exchange-Traded Fund) data (ETF names, tickers, performance, holdings, expense ratios, etc.)
4. **Distributions** - Historical distribution/payout data for mutual funds (dividends, capital gains, return of capital, foreign tax, interest, etc. by year)
5. **Continuation** - Whether this query is a follow-up to a previous message in the conversation, referring to funds, strategies, or topics already discussed earlier in this session.

Classification rules:
- Set "needs_articles" to true if the query asks about concepts, definitions, how-to, strategies, or general education
- Set "needs_funds" to true if the query asks about specific mutual funds, mutual fund performance, mutual fund recommendations, or mutual fund comparisons
- Set "needs_etfs" to true if the query mentions ETFs, asks for general investment recommendations, asks "what should I invest in", or compares investment options
- If the user explicitly asks for mutual funds (for example "what about some mutual funds?", "recommend mutual funds", "which mutual fund is a good addition"), set needs_funds=true and needs_etfs=false unless the same query also explicitly asks for ETFs or ETF-vs-fund comparison.
- For generic open-ended advice (for example "what should I invest in", "what should I buy", "best investments for me", "give me investment advice") when the user is NOT asking for specific fund codes, ETF tickers, or live performance tables, set needs_articles=true and needs_funds=false and needs_etfs=false (article-backed general guidance only). If they explicitly want fund or ETF recommendations with data, set needs_funds and/or needs_etfs true.
- Set "needs_etfs" to false if the query is specifically and only about mutual funds, articles, or non-investment topics
- Set "needs_distribution_mutual_funds" to true if the query asks about mutual fund distributions, payouts, dividends, capital gains distributions, tax breakdowns, or distribution history. This is only relevant when needs_funds is also true.
- Set "is_continuation" to true if the query refers back to something discussed earlier: uses pronouns like "it", "that", "those", "them", "the one you mentioned", "the first one", "that fund", or phrases like "tell me more", "what about", "compared to what you said", "go back to", "the fund you recommended", "explain more about that".
- Set "is_continuation" to true if the query is a short follow-up that only makes sense in the context of prior messages (e.g. "why?", "and?", "what about fees?", "is that good?", "how does it compare?").
- If recent conversation history is provided, use it to infer the referenced instrument/topic in follow-up questions. Example: if prior messages discussed ETFs and user asks "what about 5yr performance?", set needs_etfs=true (not needs_funds unless funds are explicitly requested).
- Set "is_continuation" to false for new standalone questions that do not reference prior conversation.
- is_continuation can be true alongside other flags being true or false.
- When in doubt, set is_continuation to false (safer to re-fetch than miss context).
- Multiple fields can be true if the query spans multiple data sources
- All can be false only if the query is off-topic (not about investing/mutual funds/ETFs)

**Scope guard — "is_allowed" (required):**
- Set "is_allowed" to true if the user is asking about investing, personal finance, mutual funds, ETFs, Canadian registered accounts, taxes or fees as they relate to investing, portfolio concepts, or a continuation of such a topic (including short follow-ups like "why?" or "tell me more" when conversation history is financial).
- Set "is_allowed" to false for queries that are not about financial advising or investable topics in this domain: e.g. weather, sports, coding homework, medical advice, politics, creative writing, general chit-chat, or anything with no plausible link to the data sources above.
- When recent conversation history is about investing and the current message is a short continuation, set is_allowed true.
- When in doubt between allowed and not allowed, prefer is_allowed true only if there is a clear investing or Canadian personal-finance angle; otherwise false.

Examples:
- "What is a mutual fund?" → needs_articles: true, needs_funds: false, needs_etfs: false, needs_distribution_mutual_funds: false
- "Show me the top performing Canadian equity funds" → needs_articles: false, needs_funds: true, needs_etfs: false, needs_distribution_mutual_funds: false
- "How do RRSP contribution limits work?" → needs_articles: true, needs_funds: false, needs_etfs: false, needs_distribution_mutual_funds: false
- "What are some good balanced funds and how do they work?" → needs_articles: true, needs_funds: true, needs_etfs: false, needs_distribution_mutual_funds: false
- "Compare the fees of fund ABC123 vs DEF456" → needs_articles: false, needs_funds: true, needs_etfs: false, needs_distribution_mutual_funds: false
- "Show me top performing ETFs" → needs_articles: false, needs_funds: false, needs_etfs: true, needs_distribution_mutual_funds: false
- "What should I invest in?" → needs_articles: true, needs_funds: false, needs_etfs: false, needs_distribution_mutual_funds: false
- "Compare ETF XYZ with mutual fund ABC" → needs_articles: false, needs_funds: true, needs_etfs: true, needs_distribution_mutual_funds: false, is_continuation: false
- "How do ETFs differ from mutual funds?" → needs_articles: true, needs_funds: false, needs_etfs: false, needs_distribution_mutual_funds: false, is_continuation: false
- "What distributions did fund RBF565 pay last year?" → needs_articles: false, needs_funds: true, needs_etfs: false, needs_distribution_mutual_funds: true, is_continuation: false
- "Show me the capital gains history for this fund" → needs_articles: false, needs_funds: true, needs_etfs: false, needs_distribution_mutual_funds: true, is_continuation: false
- "What's the weather today?" → is_allowed: false, needs_articles: false, needs_funds: false, needs_etfs: false, needs_distribution_mutual_funds: false, is_continuation: false
- "tell me more about it" → is_continuation: true, needs_funds: false, needs_articles: false, needs_etfs: false, needs_distribution_mutual_funds: false
- "what about the fees for that fund?" → is_continuation: true, needs_funds: false, needs_articles: false, needs_etfs: false, needs_distribution_mutual_funds: false
- "why did you recommend MAW104?" → is_continuation: true, needs_funds: false, needs_articles: false, needs_etfs: false, needs_distribution_mutual_funds: false
- "how does RRSP work?" → is_continuation: false, needs_articles: true, needs_funds: false, needs_etfs: false, needs_distribution_mutual_funds: false
- "what should I invest in?" → is_continuation: false, needs_articles: true, needs_funds: false, needs_etfs: false, needs_distribution_mutual_funds: false

Respond ONLY with valid JSON in this exact format:
{
  "is_allowed": true or false,
  "needs_articles": true or false,
  "needs_funds": true or false,
  "needs_etfs": true or false,
  "needs_distribution_mutual_funds": true or false,
  "is_continuation": true or false
}`

const PROFILE_FIELDS = [
    'age',
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

function hasExplicitMutualFundIntent(query) {
    if (!query || typeof query !== 'string') return false
    const normalized = query.toLowerCase()
    return /\bmutual\s*funds?\b/.test(normalized)
}

function hasExplicitETFIntent(query) {
    if (!query || typeof query !== 'string') return false
    const normalized = query.toLowerCase()
    return /\betfs?\b|\bexchange[-\s]*traded\s*funds?\b/.test(normalized)
}

function hasCrossAssetComparisonIntent(query) {
    if (!query || typeof query !== 'string') return false
    const normalized = query.toLowerCase()
    return /(compare|comparison|vs\.?|versus|difference|differ)/.test(normalized)
}

/**
 * General mode: profile + articles only (no fund/ETF tables) — allows more chunks in prompt.
 * Narrow mode: strict grounded context including fund/ETF data when requested.
 */
function applyResponseMode(classification) {
    classification.response_mode =
        classification.needs_funds || classification.needs_etfs ? 'narrow' : 'general'
    return classification
}

function buildConversationSummary(historyMessages, limit = 10) {
    if (!Array.isArray(historyMessages) || historyMessages.length === 0) {
        return 'none'
    }

    const recent = historyMessages.slice(-limit)
    const lines = recent
        .filter((msg) => msg && typeof msg.content === 'string' && msg.content.trim())
        .map((msg, idx) => {
            const role = String(msg.role || '').toLowerCase()
            const normalizedRole = role === 'ai' || role === 'model' ? 'assistant' : 'user'
            const compact = msg.content.replace(/\s+/g, ' ').trim().slice(0, 300)
            return `${idx + 1}. ${normalizedRole}: ${compact}`
        })

    return lines.length > 0 ? lines.join('\n') : 'none'
}

/**
 * Classifies a user query to determine what data sources are needed
 * 
 * @param {string} userQuery - The user's question or input
 * @returns {Promise<{is_allowed: boolean, needs_articles: boolean, needs_funds: boolean, needs_etfs: boolean, needs_distribution_mutual_funds: boolean, is_continuation: boolean, response_mode: 'general' | 'narrow'}>} Classification result
 */
export async function classifyQuery(userQuery, userProfile = null, historyMessages = []) {
    if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
        throw new Error('Invalid query: must be a non-empty string')
    }

    try {
        const profileSummary = buildProfileSummary(userProfile)
        const profileText = profileSummary ? JSON.stringify(profileSummary) : 'none'
        const conversationSummary = buildConversationSummary(historyMessages, 10)

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
                                { text: `${CLASSIFICATION_PROMPT}\n\nUser profile summary: ${profileText}\n\nRecent conversation history (latest first-to-last window):\n${conversationSummary}\n\nUser query: "${userQuery}"` }
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
            typeof classification.needs_distribution_mutual_funds !== 'boolean' ||
            typeof classification.is_continuation !== 'boolean'
        ) {
            throw new Error('Invalid classification response: missing or invalid boolean fields')
        }

        if (typeof classification.is_allowed !== 'boolean') {
            classification.is_allowed = true
        }

        if (isGenericRecommendationIntent(userQuery)) {
            classification.is_allowed = true
            classification.needs_articles = true
            classification.needs_funds = false
            classification.needs_etfs = false
        }

        // Deterministic override for explicit topic pivots.
        // If user explicitly asks for mutual funds and does not explicitly ask for ETFs
        // (and is not doing a cross-asset comparison), avoid ETF carryover from history.
        const explicitMutualFund = hasExplicitMutualFundIntent(userQuery)
        const explicitETF = hasExplicitETFIntent(userQuery)
        const crossAssetComparison = hasCrossAssetComparisonIntent(userQuery)
        if (explicitMutualFund && !explicitETF && !crossAssetComparison) {
            classification.is_allowed = true
            classification.needs_funds = true
            classification.needs_etfs = false
        }

        applyResponseMode(classification)
        console.log(`📊 Query classified: allowed=${classification.is_allowed}, articles=${classification.needs_articles}, funds=${classification.needs_funds}, etfs=${classification.needs_etfs}, distribution=${classification.needs_distribution_mutual_funds}, continuation=${classification.is_continuation}, mode=${classification.response_mode}`)

        return classification

    } catch (error) {
        console.error('Classification error:', error.message)
        
        // Fallback: article-backed general path (no fund/ETF tables) to avoid heavy retrieval on errors
        return applyResponseMode({
            is_allowed: true,
            needs_articles: true,
            needs_funds: false,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
            is_continuation: false,
        })
    }
}
