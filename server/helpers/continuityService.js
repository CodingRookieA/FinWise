/**
 * continuityService.js
 * Reconstructs context from prior AI messages in a conversation session.
 * Extracts RECOMMENDATIONS and SOURCES from stored AI responses and fetches
 * referenced funds and chunks from the database.
 */

import { parseAIResponse } from './responseParser.js'
import { MutualFund } from '../models/MutualFund.js'
import { Chunk } from '../models/Chunks.js'
import etfHelpers from './etfHelpers.js'
import { slimETF } from './etfService.js'

/**
 * Reconstructs context from prior AI messages in a session.
 * Parses RECOMMENDATIONS and SOURCES blocks from stored raw AI responses.
 * Fetches only the referenced fund codes and chunk IDs from DB.
 *
 * @param {string} sessionId - The session ID to look up prior messages
 * @param {mongoose.Model} MessageModel - The Message model for database queries
 * @returns {Promise<{ funds: Array, chunks: Array, etfs: Array, hasContext: boolean }>}
 *   hasContext: false if no prior messages had any recommendations or sources
 */
export async function reconstructContinuityContext(sessionId, MessageModel) {
  try {
    // Step 1: Fetch last 5 turns from this session (up to 10 messages) and
    // then parse only AI messages in that window.
    const recentMessages = await MessageModel
      .find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('role content')
      .lean()

    const priorAIMessages = recentMessages.filter((msg) => msg.role === 'AI').slice(0, 5)

    if (!priorAIMessages || priorAIMessages.length === 0) {
      return { funds: [], chunks: [], etfs: [], hasContext: false }
    }

    // Step 2: Parse each raw content with parseAIResponse
    const allRecommendations = []
    const allSources = []

    for (const msg of priorAIMessages) {
      try {
        const { recommendations, sources } = parseAIResponse(msg.content)
        if (recommendations) allRecommendations.push(recommendations)
        if (sources) allSources.push(sources)
      } catch {
        // Silently skip parsing errors for individual messages
        continue
      }
    }

    // Step 3: Extract unique symbols from all recommendations
    // recommendations shape: { "MAW104": "reason", "TDB900": "reason" }
    const allSymbolsSet = new Set()
    for (const rec of allRecommendations) {
      Object.keys(rec).forEach(symbol => allSymbolsSet.add(symbol))
    }

    // Mutual fund codes are typically not TSX ticker format; ETF tickers are
    // usually TSX-style symbols ending with .TO in this dataset.
    const allSymbols = Array.from(allSymbolsSet)
    const etfSymbols = allSymbols.filter((symbol) => /\.TO$/i.test(symbol))
    const fundSymbols = allSymbols.filter((symbol) => !/\.TO$/i.test(symbol))

    // Step 4: Extract unique source references from all sources
    // sources shape: { "chunkId": chunkIndex }
    // Deduplicate by chunk ID, keeping earliest index seen
    const sourceRefsMap = new Map()
    let invalidIdCount = 0
    for (const sources of allSources) {
      for (const [chunkId, index] of Object.entries(sources)) {
        // Filter out invalid chunk IDs (e.g., URLs instead of valid ObjectIds)
        // Valid MongoDB ObjectIds are 24-character hex strings
        if (chunkId && /^[a-f0-9]{24}$/i.test(chunkId) && !sourceRefsMap.has(chunkId)) {
          sourceRefsMap.set(chunkId, index)
        } else if (chunkId && !/^[a-f0-9]{24}$/i.test(chunkId)) {
          invalidIdCount += 1
        }
      }
    }
    if (invalidIdCount > 0) {
      console.log(`[continuityService] Filtered out ${invalidIdCount} invalid chunk IDs (likely URLs from parsing error)`)
    }
    const sourceRefs = Array.from(sourceRefsMap).map(([id, index]) => ({ id, index }))

    // Step 5: If both are empty, return hasContext: false
    if (fundSymbols.length === 0 && etfSymbols.length === 0 && sourceRefs.length === 0) {
      return { funds: [], chunks: [], etfs: [], hasContext: false }
    }

    // Step 6: Fetch funds, chunks, and ETFs in parallel.
    // Apply thresholds: max 10 funds, max 10 ETFs, max 3 chunks.
    // For funds, always include distribution data so user can see distributions
    // for the referenced funds without needing a second retrieval.
    const [funds, chunks, allETFs] = await Promise.all([
      fundSymbols.length > 0
        ? MutualFund.find({ fund_code: { $in: fundSymbols } })
            .select('fund_code name nav mer 1yr 3yr 5yr risk fund_type minimum_investment distribution -_id')
            .limit(10)
            .lean()
        : Promise.resolve([]),
      sourceRefs.length > 0
        ? Chunk.find({ _id: { $in: sourceRefs.map(r => r.id) } })
            .select('_id content source_url source_category chunk_index')
            .limit(3)
            .lean()
        : Promise.resolve([]),
      etfSymbols.length > 0
        ? etfHelpers.fetchAllETFs()
        : Promise.resolve([])
    ])

    const etfSymbolSet = new Set(etfSymbols.map((symbol) => symbol.toUpperCase()))
    const matchedRawEtfs = Array.isArray(allETFs)
      ? allETFs.filter((etf) => etf?.symbol && etfSymbolSet.has(String(etf.symbol).toUpperCase()))
      : []
    const matchedSymbols = new Set(matchedRawEtfs.map((etf) => String(etf.symbol).toUpperCase()))
    const missingSymbols = etfSymbols.filter((symbol) => !matchedSymbols.has(String(symbol).toUpperCase()))
    if (missingSymbols.length > 0) {
      console.log(`[continuityService] ETF symbols not found from provider: ${missingSymbols.join(', ')}`)
    }
    const etfs = matchedRawEtfs.map((etf) => slimETF(etf)).slice(0, 10)

    // Step 7: Return results only when there is usable reconstructed context.
    const hasUsableContext = funds.length > 0 || chunks.length > 0 || etfs.length > 0

    console.log(`[continuityService] Reconstructed: ${funds.length} funds, ${etfs.length} etfs, ${chunks.length} chunks from ${priorAIMessages.length} prior AI messages`)

    return { funds, chunks, etfs, hasContext: hasUsableContext }
  } catch (error) {
    console.error('[continuityService] Error reconstructing context:', error.message)
    // Graceful degradation: return empty context on any error
    return { funds: [], chunks: [], etfs: [], hasContext: false }
  }
}
