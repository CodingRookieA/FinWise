import { embedText } from '../services/article/embeddingService.js'
import { Chunk } from '../models/Chunks.js'
import { MutualFund } from '../models/MutualFund.js'
import { Profile } from '../models/profile.js'
import { Asset } from '../models/Asset.js'
import etfHelpers from './etfHelpers.js'
import { getMatchingETFs } from './etfService.js'
import { ENVIRONMENT } from '../utils/constants.js'
import { buildArticleRetrievalQuery } from './profileRetrievalAugmentation.js'

function isGeneralMode(classification) {
    if (classification.response_mode === 'narrow') return false
    if (classification.response_mode === 'general') return true
    return (
        Boolean(classification.needs_articles) &&
        !classification.needs_funds &&
        !classification.needs_etfs
    )
}

/** Narrow mode: strict grounding when article and/or fund/ETF tables are provided */
const SYSTEM_PROMPT_NARROW =
`You are a financial guidance assistant specialized in mutual fund investing.

CRITICAL RULES:
1. **SOURCE OF TRUTH**: You will be provided with context from articles and/or fund data below. When context is provided, you MUST answer ONLY based on that context. DO NOT use your pre-trained knowledge.

2. **If context is provided**: Base your entire answer on the provided information. If the context doesn't contain enough information to fully answer the question, say "Based on the available information, [answer what you can], but I don't have additional details on [what's missing]."

3. **If NO context is provided**: You may use your general knowledge, but clearly state "Based on general knowledge" at the start of your response.

4. **Never make up information**: If you're unsure or the information isn't in the provided context, admit it clearly.

5. **Be concise**: Keep responses under 150 words unless asked otherwise.

6. **Clarity**: If a question is ambiguous, ask for clarification before answering.

7. **User personalization**: If a USER PROFILE section is provided, tailor your response to the user's situation (risk tolerance, experience level, financial goals, etc.) without repeating their data back to them.

8. **Portfolio awareness**: If a USER PORTFOLIO section is provided, use it to ground recommendations in the user's current holdings (diversification, concentration, overlap, and potential gaps).

9. **ETFs with missing fields**: When MER is null for an ETF, do not estimate or guess the value. Tell the user to verify the expense ratio on the ETF provider's website (e.g. iShares.ca, vanguard.ca, bmo.com/etfs) before investing. When fund_category is null, describe the ETF based on its name, performance data, and dividend yield rather than refusing to answer. TSX-listed ETFs are generally eligible for RRSP, TFSA, and FHSA accounts, but always recommend users verify eligibility with their broker.

10. **Source attribution**: At the very end of your response after all structured blocks, do NOT include the legacy metadata line format. Source attribution is handled ONLY through SOURCES JSON block (see rule 13). Do not output "[Sources: ... | Context: ...]" line.

11. **DEBUG: Conversation History Awareness**: At the START of your response, include a brief internal note showing what you understand from the conversation history (if any). Use this format:
[Internal Note: Previous context - <what you see in prior messages, e.g., "User asked about CDZ.TO ETF, I recommended it with 3.24% yield"> OR "No prior context"]
This helps us debug whether conversation continuity is working.

12. **Structured recommendations (FUNDS/ETFs ONLY)**: When you recommend specific mutual funds or ETFs,
        append a RECOMMENDATIONS block at the very end of your response in this exact format:

        RECOMMENDATIONS:
        {
            "SYMBOL": "one sentence reason why you recommended this fund/ETF",
            "SYMBOL2": "reason"
        }

        Rules for RECOMMENDATIONS:
        - ONLY use this block for fund codes and ETF tickers
        - Never include article topics or educational content in RECOMMENDATIONS
        - Only include funds/ETFs you explicitly recommended in your response
        - Do not include funds/ETFs you merely mentioned or compared without recommending
        - Recommendation count target: include 4-5 recommended symbols whenever enough suitable candidates are available in provided context
        - If fewer than 4 suitable symbols are available, include all suitable ones (up to 5 max)
        - Omit this block entirely if you made no specific fund/ETF recommendations
        - Use the exact fund code or ETF ticker as the key (e.g. "MAW104", "XIU.TO")
        - Keep each reason concise (1-2 sentences)
        - In the plain text section, do not list or name specific fund codes or ETF tickers
        - Put all specific recommended symbols and their detailed reasons only inside the RECOMMENDATIONS JSON block

13. **Structured sources (ARTICLE CONTEXT ONLY)**: Append a SOURCES block ONLY when ARTICLE
        CONTEXT chunks were provided AND you used them to inform your response. NEVER include
        SOURCES for mutual fund or ETF recommendations. The SOURCES block format:

        SOURCES:
        {
            "chunk_id_here": chunk_index_number,
            "chunk_id_here2": chunk_index_number
        }

        Rules for SOURCES:
        - ONLY use this block for article chunks from ARTICLE CONTEXT section
        - NEVER use SOURCES for fund/ETF data — no SOURCES block for funds or ETFs
        - The key MUST be the exact chunk_id found in the [Source N: id=<chunk_id> | ...] tag
        - The value is the integer chunk_index (the N in [Source N: ...])
        - Do NOT use URLs as keys; they must be chunk IDs (24-character hex strings)
        - Only include chunks you actually drew from to answer the question
        - Omit this block entirely if no article chunks were provided or used

14. **Block placement**: RECOMMENDATIONS and SOURCES blocks must ALWAYS appear at
        the very end of your response, after all plain text. Never interleave them with
        your explanation. The user will only see the plain text portion - the blocks are
    for system use only.

15. **Output format precedence**: Use RECOMMENDATIONS and SOURCES blocks as the only
    machine-readable metadata format. Do NOT output the legacy metadata line format
    '[Sources: ... | Context: ...]'. If source attribution is needed, use only the
    SOURCES JSON block defined above.`

/** General mode: profile + article chunks; may supplement when chunks are thin (no fund/ETF tables) */
const SYSTEM_PROMPT_GENERAL =
`You are a financial guidance assistant for Canadian investors (mutual funds and ETFs).

**MODE: General educational guidance (article-backed, no live fund/ETF product tables)**

1. **PRIMARY REFERENCE**: You receive USER PROFILE and ARTICLE CONTEXT chunks. Prefer facts and framing from the article chunks when they apply. Use the SOURCES JSON block (same format as below) only when you relied on specific chunks.

2. **SUPPLEMENTARY GUIDANCE**: If article context is missing or incomplete, you may add short, prudent general guidance. Make it obvious what came from the articles vs. general principles (e.g. lead with what the materials say, then "More generally, …"). Do not invent specific MERs, returns, fund codes, or tickers that are not in the context.

3. **No product tables in this mode**: You will not receive mutual fund or ETF performance tables here. Do not output a RECOMMENDATIONS block. Do not name specific fund codes or ETF tickers as recommendations; stay at the level of concepts, account types, risk concepts, and sensible next steps (e.g. speak to a qualified professional for personalized advice).

4. **Thorough**: Be thorough and detailed in your response.

5. **User profile**: Tailor tone and examples to the user's situation without listing their profile fields back verbatim.

6. **DEBUG**: At the START of your response, include:
[Internal Note: Previous context - <brief note from conversation history> OR "No prior context"]

7. **SOURCES block** (article chunks only, when used):
SOURCES:
{ "chunk_object_id": chunk_index_number }
Rules: keys are chunk ids from [Source N: id=...] lines; values are N. Omit if no chunks informed the answer.`

export default {
    //Function for generating prompts based on user input and context
    async generatePrompt(userInput, userId = null, classification = { needs_articles: false, needs_funds: false, needs_etfs: false, needs_distribution_mutual_funds: false }, history = []) {
        let contextSections = []
        const isGeneral = isGeneralMode(classification)

        // Add user profile info if userId is provided
        if (userId) {
            const userInfo = await this.getUserInfo(userId)
            if (userInfo) {
                contextSections.push('\n--- USER PROFILE (Use for personalization) ---\n' + userInfo)
            }

            if (!isGeneral) {
                const portfolioInfo = await this.getUserPortfolioContext(userId)
                if (portfolioInfo) {
                    contextSections.push('\n--- USER PORTFOLIO (Use for allocation context) ---\n' + portfolioInfo)
                }
            }
        }

        const articleSectionTitle = isGeneral
            ? '\n--- ARTICLE CONTEXT (primary reference) ---\n'
            : '\n--- ARTICLE CONTEXT (Source of Truth) ---\n'

        // Article chunks: if this turn needs articles, always run a fresh vector search for the
        // current message (overrides session prefetched chunks). Otherwise use continuity chunks only.
        if (classification.needs_articles) {
            const chunkLimit =
                isGeneral
                    ? ENVIRONMENT.articleChunkLimitGeneral
                    : ENVIRONMENT.articleChunkLimitNarrow
            const articles = await this.getInvestmentDocs(userInput, {
                chunkLimit,
                userId,
                responseMode: isGeneral ? 'general' : 'narrow',
            })
            if (articles) {
                contextSections.push(articleSectionTitle + articles)
            }
        } else if (classification._prefetchedChunks?.length > 0) {
            const chunkText = this.formatChunksAsText(classification._prefetchedChunks)
            contextSections.push(articleSectionTitle + chunkText)
        }

        const injectProductData = !isGeneral

        // If the query needs fund data, we can add a prompt to fetch relevant fund information from the database
        if (injectProductData && classification._prefetchedFunds?.length > 0) {
            // Use pre-fetched funds from continuity reconstruction
            const fundText = this.formatFundsAsText(classification._prefetchedFunds)
            contextSections.push('\n--- MATCHING MUTUAL FUNDS (Source of Truth) ---\n' + fundText)
        } else if (injectProductData && classification.needs_funds) {
            // Include fund data context in system prompt
            const funds = await this.getSFundInfo(userId, classification.needs_distribution_mutual_funds)
            if (funds) {
                contextSections.push('\n--- MATCHING MUTUAL FUNDS (Source of Truth) ---\n' + funds)
            }
        }

        if (injectProductData && classification._prefetchedEtfs?.length > 0) {
            const etfText = this.formatETFsAsText(classification._prefetchedEtfs)
            contextSections.push('\n--- MATCHING ETFs (Source of Truth) ---\n' + etfText)
        } else if (injectProductData && classification.needs_etfs) {
            const etfs = await this.getSETFInfo(userId)
            if (etfs) {
                contextSections.push('\n--- MATCHING ETFs (Source of Truth) ---\n' + etfs)
            }
        }

        const baseSystemPrompt = isGeneral ? SYSTEM_PROMPT_GENERAL : SYSTEM_PROMPT_NARROW
        const fullSystemPrompt = contextSections.length > 0
            ? baseSystemPrompt + '\n' + contextSections.join('\n') + '\n--- END OF CONTEXT ---\n'
            : baseSystemPrompt + '\n\n(No specific context provided for this query.)\n'

        console.log('Generated system prompt:\n', fullSystemPrompt)

        // Return messages array for API calls
        return [
            { role: "system", content: fullSystemPrompt },
            ...history,
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

            const funds = await MutualFund.find(filter, projection).limit(10).lean()

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

    //Function for getting ETF information
    async getSETFInfo(userId) {
        try {
            const profile = userId ? await Profile.findOne({ userId }).lean() : null
            const allETFs = await etfHelpers.fetchAllETFs()
            const matches = getMatchingETFs(profile || {}, allETFs)

            if (!matches || matches.length === 0) {
                return '[NO MATCHING ETFs] No ETFs matched the current criteria. Suggest the user refine their question or try a different investing goal.'
            }

            return matches.map((etf, i) => {
                const currentPrice = etf.current_price != null ? `$${etf.current_price}` : 'N/A'
                const ytdReturn = etf.ytd_return != null ? `${etf.ytd_return}%` : 'N/A'
                const threeMonth = etf.three_month_return != null ? `${etf.three_month_return}%` : 'N/A'
                const oneYear = etf.fifty_two_week_return != null ? `${etf.fifty_two_week_return}%` : 'N/A'
                const dividendYield = etf.dividend_yield != null ? `${etf.dividend_yield}%` : 'N/A'
                const netAssets = etf.net_assets != null ? `$${etf.net_assets}` : 'N/A'

                let entry = `ETF ${i + 1}: ${etf.name} (${etf.symbol})\n`
                entry += `  Price: ${currentPrice} | YTD: ${ytdReturn} | 3mo: ${threeMonth} | 1yr: ${oneYear}\n`
                entry += `  Yield: ${dividendYield} | Net Assets: ${netAssets} | Market: ${etf.exchange}\n`
                entry += `  MER: ${etf.mer ?? 'null'} | Category: ${etf.fund_category ?? 'null'}\n`
                entry += `  Benchmark: ${etf.benchmark ?? 'null'} | Holdings: ${etf.num_holdings ?? 'null'}\n`
                return entry
            }).join('\n')
        } catch (error) {
            console.error('Error fetching ETF data:', error.message)
            return ''
        }
    },


    //Function to fetch and format user profile info for prompt injection
    async getUserInfo(userId) {
        try {
            const profile = await Profile.findOne({ userId })
            if (!profile) return ''

            const fields = []

            if (profile.age)                  fields.push(`Age: ${profile.age}`)
            if (profile.employment_status)    fields.push(`Employment status: ${profile.employment_status}`)
            if (profile.income_stability)     fields.push(`Income stability: ${profile.income_stability}`)
            if (profile.monthly_income != null) fields.push(`Monthly income: $${profile.monthly_income}`)
            if (profile.housing_status)       fields.push(`Housing status: ${profile.housing_status}`)
            if (profile.savings_balance != null) fields.push(`Savings balance: $${profile.savings_balance}`)
            if (profile.debt_amount != null)  fields.push(`Debt amount: $${profile.debt_amount}`)
            if (profile.risk_tolerance)       fields.push(`Risk tolerance: ${profile.risk_tolerance}`)
            if (profile.investment_experience) fields.push(`Investment experience: ${profile.investment_experience}`)
            if (profile.financial_goal)       fields.push(`Financial goal: ${profile.financial_goal}`)
            if (profile.investment_preference) fields.push(`Investment preference: ${profile.investment_preference}`)

            if (fields.length === 0) return ''

            return fields.join('\n')
        } catch (error) {
            console.error('Error fetching user profile:', error.message)
            return ''
        }
    },

    async getUserPortfolioContext(userId) {
        if (!userId) return ''

        try {
            const assets = await Asset.find({ user_id: userId })
                .sort({ updatedAt: -1 })
                .select('symbol type quantity -_id')
                .lean()

            if (!assets || assets.length === 0) {
                return ''
            }

            const totalQuantity = assets.reduce((sum, asset) => sum + (Number(asset.quantity) || 0), 0)
            const etfCount = assets.filter((asset) => asset.type === 'ETF').length
            const mfCount = assets.filter((asset) => asset.type === 'Mutual Fund').length

            const holdingsLines = assets
                .slice(0, 20)
                .map((asset, i) => `Holding ${i + 1}: ${asset.symbol} | Type: ${asset.type} | Quantity: ${asset.quantity}`)

            let summary = `Total holdings: ${assets.length} | ETFs: ${etfCount} | Mutual Funds: ${mfCount} | Aggregate quantity: ${totalQuantity}`
            if (assets.length > 20) {
                summary += `\n(Showing top 20 most recently updated holdings out of ${assets.length})`
            }

            return `${summary}\n${holdingsLines.join('\n')}`
        } catch (error) {
            console.error('Error fetching user portfolio:', error.message)
            return ''
        }
    },

    async getInvestmentDocs(userInput, options = {}) {
        try {
            const chunkLimit = options.chunkLimit ?? ENVIRONMENT.articleChunkLimitNarrow
            let textForEmbedding = userInput
            if (options.responseMode === 'general' && options.userId) {
                const profile = await Profile.findOne({ userId: options.userId }).lean()
                if (profile) {
                    textForEmbedding = buildArticleRetrievalQuery(userInput, profile)
                }
            }
            const queryEmbedding = await embedText(textForEmbedding)
            const threshold = ENVIRONMENT.similarityThreshold

            // Vector search: general mode uses more chunks (see ENVIRONMENT.articleChunkLimitGeneral)
            const numCandidates = Math.max(100, Math.min(400, chunkLimit * 40))

            const results = await Chunk.aggregate([
                {
                    $vectorSearch: {
                        index: "chunk_embedding_index",
                        path: "embedding",
                        queryVector: queryEmbedding,
                        numCandidates,
                        limit: chunkLimit
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
                `[Source ${i + 1}: id=${chunk._id} | URL: ${chunk.source_url} | Category: ${chunk.source_category} | Score: ${chunk.score.toFixed(4)}]\n${chunk.content}`
            ).join('\n\n')
        } catch (error) {
            console.error('Error fetching article context:', error.message)
            return ''
        }
    },

    formatFundsAsText(funds) {
        // Format pre-fetched funds the same way getSFundInfo() does
        return funds.map((fund, i) => {
            let entry = `Fund ${i + 1}: ${fund.name} (${fund.fund_code})\n`
            entry += `  NAV: $${fund.nav} | MER: ${fund.mer}% | Risk: ${fund.risk} | Type: ${fund.fund_type}\n`
            entry += `  Returns — 1yr: ${fund['1yr'] != null ? fund['1yr'] + '%' : 'N/A'}, 3yr: ${fund['3yr'] != null ? fund['3yr'] + '%' : 'N/A'}, 5yr: ${fund['5yr'] != null ? fund['5yr'] + '%' : 'N/A'}\n`
            if (fund.minimum_investment != null) entry += `  Min Investment: $${fund.minimum_investment}\n`
            return entry
        }).join('\n')
    },

    formatChunksAsText(chunks) {
        // Format pre-fetched chunks the same way getInvestmentDocs() does
        return chunks.map((chunk, i) =>
            `[Source ${i + 1}: id=${chunk._id} | URL: ${chunk.source_url} | Category: ${chunk.source_category}]\n${chunk.content}`
        ).join('\n\n')
    },

    formatETFsAsText(etfs) {
        // Format pre-fetched ETFs the same way getSETFInfo() does
        return etfs.map((etf, i) => {
            const currentPrice = etf.current_price != null ? `$${etf.current_price}` : 'N/A'
            const ytdReturn = etf.ytd_return != null ? `${etf.ytd_return}%` : 'N/A'
            const threeMonth = etf.three_month_return != null ? `${etf.three_month_return}%` : 'N/A'
            const oneYear = etf.fifty_two_week_return != null ? `${etf.fifty_two_week_return}%` : 'N/A'
            const dividendYield = etf.dividend_yield != null ? `${etf.dividend_yield}%` : 'N/A'
            const netAssets = etf.net_assets != null ? `$${etf.net_assets}` : 'N/A'

            let entry = `ETF ${i + 1}: ${etf.name} (${etf.symbol})\n`
            entry += `  Price: ${currentPrice} | YTD: ${ytdReturn} | 3mo: ${threeMonth} | 1yr: ${oneYear}\n`
            entry += `  Yield: ${dividendYield} | Net Assets: ${netAssets} | Market: ${etf.exchange}\n`
            entry += `  MER: ${etf.mer ?? 'null'} | Category: ${etf.fund_category ?? 'null'}\n`
            entry += `  Benchmark: ${etf.benchmark ?? 'null'} | Holdings: ${etf.num_holdings ?? 'null'}\n`
            return entry
        }).join('\n')
    }
}