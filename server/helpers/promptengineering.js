import { embedText } from '../services/article/embeddingService.js'
import { Chunk } from '../models/Chunks.js'
import { MutualFund } from '../models/MutualFund.js'
import { Profile } from '../models/profile.js'
import { ENVIRONMENT } from '../utils/constants.js'

const SYSTEM_PROMPT = 
`You are a financial guidance assistant specialized in mutual fund investing.

CRITICAL RULES:
1. **SOURCE OF TRUTH**: You will be provided with context from articles and/or fund data below. When context is provided, you MUST answer ONLY based on that context. DO NOT use your pre-trained knowledge.

2. **If context is provided**: Base your entire answer on the provided information. If the context doesn't contain enough information to fully answer the question, say "Based on the available information, [answer what you can], but I don't have additional details on [what's missing]."

3. **If NO context is provided**: You may use your general knowledge, but clearly state "Based on general knowledge" at the start of your response.

4. **Never make up information**: If you're unsure or the information isn't in the provided context, admit it clearly.

5. **Be concise**: Keep responses under 150 words unless asked otherwise.

6. **Clarity**: If a question is ambiguous, ask for clarification before answering.

7. **User personalization**: If a USER PROFILE section is provided, tailor your response to the user's situation (risk tolerance, experience level, financial goals, etc.) without repeating their data back to them.

8. **Source attribution**: At the very end of your response, include a metadata line in this exact format:
[Sources: <comma-separated list of source URLs used> | Context: <"articles", "funds", "articles+funds", or "none">]
If no context was provided, use: [Sources: none | Context: none]`;

export default {
    //Function for generating prompts based on user input and context
    async generatePrompt(userInput, userId = null, classification = { needs_articles: false, needs_funds: false, needs_ETF: false, needs_distribution_mutual_funds: false }) {
        let contextSections = []

        // Add user profile info if userId is provided
        if (userId) {
            const userInfo = await this.getUserInfo(userId)
            if (userInfo) {
                contextSections.push('\n--- USER PROFILE (Use for personalization) ---\n' + userInfo)
            }
        }

        if(classification.needs_articles) {
            const articles = await this.getInvestmentDocs(userInput)
            if (articles) {
                contextSections.push('\n--- ARTICLE CONTEXT (Source of Truth) ---\n' + articles)
            }
        }
        
       
        // If the query needs fund data, we can add a prompt to fetch relevant fund information from the database
        if(classification.needs_funds) {
            // Include fund data context in system prompt
            const funds = await this.getSFundInfo(userId, classification.needs_distribution_mutual_funds)
            if (funds) {
                contextSections.push('\n--- FUND DATA (Source of Truth) ---\n' + funds)
            }
        }

        const fullSystemPrompt = contextSections.length > 0
            ? SYSTEM_PROMPT + '\n' + contextSections.join('\n') + '\n--- END OF CONTEXT ---\n'
            : SYSTEM_PROMPT + '\n\n(No specific context provided for this query.)\n'

        console.log('Generated system prompt:\n', fullSystemPrompt)

        // Return messages array for API calls
        return [
            { role: "system", content: fullSystemPrompt },
            { role: "user", content: userInput }
        ]
    },

    //Function for fetching mutual fund information filtered by user profile
    async getSFundInfo(userId, needDistribution = false) {
        // If user is not signed in, prompt AI to ask them to create an account
        if (!userId) {
            return '[USER NOT AUTHENTICATED] Tell the user: "This query requires real-time data, create an account to access this feature." You may still answer based on your general pretrained knowledge, but clearly note that no live fund data is available.'
        }

        try {
            // Fetch user profile for risk tolerance and savings
            const profile = await Profile.findOne({ userId })
            if (!profile) {
                return '[USER PROFILE NOT FOUND] Tell the user to complete their profile questionnaire so fund recommendations can be personalized.'
            }

            // Map risk tolerance levels for comparison (lower number = lower risk)
            const RISK_LEVELS = { 'low': 1, 'medium': 2, 'high': 3 }
            const userRiskLevel = RISK_LEVELS[profile.risk_tolerance] || 0

            // Build the query filter
            const filter = {}

            // Filter by risk: only funds with risk at or below user's tolerance
            if (userRiskLevel > 0) {
                const allowedRisks = Object.entries(RISK_LEVELS)
                    .filter(([, level]) => level <= userRiskLevel)
                    .map(([name]) => name)
                filter.risk = { $in: allowedRisks }
            }

            // Filter by minimum investment: only funds the user can afford
            // Use $expr + $convert to handle minimum_investment stored as string or number
            if (profile.savings_balance != null) {
                filter.$or = [
                    {
                        $expr: {
                            $lte: [
                                { $convert: { input: '$minimum_investment', to: 'double', onError: null, onNull: null } },
                                profile.savings_balance
                            ]
                        }
                    },
                    { minimum_investment: null },
                    { minimum_investment: { $exists: false } }
                ]
            }

            // Build projection — exclude distribution by default
            const projection = {
                fund_code: 1, name: 1, nav: 1, mer: 1,
                '1yr': 1, '3yr': 1, '5yr': 1,
                risk: 1, fund_type: 1,
                account_eligibility: 1, minimum_investment: 1,
                _id: 0
            }
            if (needDistribution) {
                projection.distribution = 1
            }

            const funds = await MutualFund.find(filter, projection).lean()

            if (!funds || funds.length === 0) {
                return '[NO MATCHING FUNDS] No mutual funds matched the user\'s risk tolerance and savings. Suggest the user review their profile or consider adjusting their risk tolerance.'
            }

            // Format funds into a readable context string
            return funds.map((fund, i) => {
                let entry = `Fund ${i + 1}: ${fund.name} (${fund.fund_code})\n`
                entry += `  NAV: $${fund.nav} | MER: ${fund.mer}% | Risk: ${fund.risk} | Type: ${fund.fund_type}\n`
                entry += `  Returns — 1yr: ${fund['1yr'] != null ? fund['1yr'] + '%' : 'N/A'}, 3yr: ${fund['3yr'] != null ? fund['3yr'] + '%' : 'N/A'}, 5yr: ${fund['5yr'] != null ? fund['5yr'] + '%' : 'N/A'}\n`
                if (fund.minimum_investment != null) entry += `  Min Investment: $${fund.minimum_investment}\n`

                if (needDistribution && fund.distribution) {
                    entry += '  Distributions:\n'
                    // distribution is a Map — iterate its entries
                    const distMap = fund.distribution instanceof Map ? fund.distribution : new Map(Object.entries(fund.distribution))
                    for (const [year, data] of distMap) {
                        const parts = []
                        if (data.total != null) parts.push(`total: ${data.total}`)
                        if (data.capitalGains != null) parts.push(`capitalGains: ${data.capitalGains}`)
                        if (data.dividends != null) parts.push(`dividends: ${data.dividends}`)
                        if (data.interest != null) parts.push(`interest: ${data.interest}`)
                        if (data.returnCapital != null) parts.push(`returnCapital: ${data.returnCapital}`)
                        if (data.foreignDividends != null) parts.push(`foreignDividends: ${data.foreignDividends}`)
                        if (data.foreignTax != null) parts.push(`foreignTax: ${data.foreignTax}`)
                        if (parts.length > 0) {
                            entry += `    ${year}: ${parts.join(', ')}\n`
                        }
                    }
                }

                return entry
            }).join('\n')
        } catch (error) {
            console.error('Error fetching mutual fund data:', error.message)
            return ''
        }
    },

    //Function for getting ETF information (placeholder)
    getSETFInfo() {
        return ``
    },


    //Function to fetch and format user profile info for prompt injection
    async getUserInfo(userId) {
        try {
            const profile = await Profile.findOne({ userId })
            if (!profile) return ''

            const fields = []

            if (profile.employment_status)    fields.push(`Employment status: ${profile.employment_status}`)
            if (profile.income_stability)     fields.push(`Income stability: ${profile.income_stability}`)
            if (profile.monthly_income != null) fields.push(`Monthly income: $${profile.monthly_income}`)
            if (profile.housing_status)       fields.push(`Housing status: ${profile.housing_status}`)
            if (profile.savings_balance != null) fields.push(`Savings balance: $${profile.savings_balance}`)
            if (profile.debt_amount != null)  fields.push(`Debt amount: $${profile.debt_amount}`)
            if (profile.risk_tolerance)       fields.push(`Risk tolerance: ${profile.risk_tolerance}`)
            if (profile.investment_experience) fields.push(`Investment experience: ${profile.investment_experience}`)
            if (profile.financial_goal)       fields.push(`Financial goal: ${profile.financial_goal}`)

            if (fields.length === 0) return ''

            return fields.join('\n')
        } catch (error) {
            console.error('Error fetching user profile:', error.message)
            return ''
        }
    },
    async getInvestmentDocs(userInput) {
        try {
            // Generate embedding for the user query
            const queryEmbedding = await embedText(userInput)
            const threshold = ENVIRONMENT.similarityThreshold

            // Perform vector search - retrieve top 5 chunks
            const results = await Chunk.aggregate([
                {
                    $vectorSearch: {
                        index: "chunk_embedding_index",
                        path: "embedding",
                        queryVector: queryEmbedding,
                        numCandidates: 100,
                        limit: 5
                    }
                },
                {
                    $project: {
                        content: 1,
                        source_url: 1,
                        source_category: 1,
                        chunk_index: 1,
                        score: { $meta: "vectorSearchScore" }
                    }
                }
            ])

            // Filter by similarity threshold
            const relevant = results.filter(r => r.score >= threshold)

            if (relevant.length === 0) {
                return ''
            }

            // Format chunks into context string
            return relevant.map((chunk, i) => 
                `[Source ${i + 1}: ${chunk.source_url} | Category: ${chunk.source_category} | Score: ${chunk.score.toFixed(4)}]\n${chunk.content}`
            ).join('\n\n')
        } catch (error) {
            console.error('Error fetching article context:', error.message)
            return ''
        }
    }
}