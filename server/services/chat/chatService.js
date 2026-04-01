import promptengineering from '../../helpers/promptengineering.js'
import { classifyQuery } from '../../helpers/classifier.js'
import { reconstructContinuityContext } from '../../helpers/continuityService.js'
import Message from '../../models/Message.js'
import { Profile } from '../../models/profile.js'
import { randomUUID } from 'crypto'
import mongoose from 'mongoose'
import { ENVIRONMENT } from '../../utils/constants.js'
import { generateAIResponse, generateAIResponseStream } from '../../clients/aiClient.js'
import { trimHistoryToTokenBudget, formatHistoryForLLM } from '../history/historyService.js'
import { parseAIResponse } from '../../helpers/responseParser.js'
import { MutualFund } from '../../models/MutualFund.js'
import { Chunk } from '../../models/Chunks.js'
import etfHelpers from '../../helpers/etfHelpers.js'
import { slimETF } from '../../helpers/etfService.js'

function resolveProfileUserId(sessionUserId) {
    return sessionUserId || null
}

async function loadUserProfile(ProfileModel, profileUserId, mongooseLib) {
    if (!profileUserId || !mongooseLib.Types.ObjectId.isValid(profileUserId)) {
        return null
    }

    return ProfileModel.findOne({ userId: profileUserId }).lean()
}

async function assertSessionOwnership(MessageModel, sessionId, sessionUserId, mongooseLib) {
    if (!sessionUserId) {
        return true
    }

    const sessionExists = await MessageModel.exists({
        sessionId,
        sender: new mongooseLib.Types.ObjectId(sessionUserId)
    })

    return Boolean(sessionExists)
}

function detectPriorAssetTypes(funds = [], etfs = []) {
    if (!Array.isArray(funds) || funds.length === 0) {
        return { hasETFs: Array.isArray(etfs) && etfs.length > 0, hasFunds: false }
    }

    const hasETFsFromFundsArray = funds.some((f) => {
        const symbol = String(f?.symbol || '').toUpperCase()
        const fundCode = String(f?.fund_code || '').toUpperCase()
        return symbol.endsWith('.TO') || (f?.fund_code == null && symbol.length > 0) || fundCode.endsWith('.TO')
    })

    const hasFunds = funds.some((f) => {
        const fundCode = String(f?.fund_code || '').toUpperCase()
        return fundCode.length > 0 && !fundCode.endsWith('.TO')
    })

    const hasETFs = hasETFsFromFundsArray || (Array.isArray(etfs) && etfs.length > 0)
    return { hasETFs, hasFunds }
}

function shouldResetContinuity(classification, priorTypes) {
    const priorOnlyETFs = priorTypes.hasETFs && !priorTypes.hasFunds
    const priorOnlyFunds = priorTypes.hasFunds && !priorTypes.hasETFs
    const newOnlyFunds = classification.needs_funds && !classification.needs_etfs
    const newOnlyETFs = classification.needs_etfs && !classification.needs_funds

    return (priorOnlyETFs && newOnlyFunds) || (priorOnlyFunds && newOnlyETFs)
}

function findMetadataStartIndex(rawText) {
    if (typeof rawText !== 'string' || rawText.length === 0) {
        return -1
    }

    // Structured metadata is appended at the end. We stream only the visible text
    // and keep metadata server-side for parsing/enrichment.
    const match = rawText.match(/(?:^|\n)\s*(RECOMMENDATIONS|SOURCES)\s*:/i)
    return typeof match?.index === 'number' ? match.index : -1
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        wait(timeoutMs).then(() => null),
    ])
}

function buildLightweightRecommendationRows(recommendations) {
    if (!recommendations || typeof recommendations !== 'object') {
        return null
    }

    const rows = Object.entries(recommendations)
        .filter(([symbol]) => typeof symbol === 'string' && symbol.trim().length > 0)
        .map(([symbol, reason]) => {
            const normalizedSymbol = symbol.trim().toUpperCase()
            const isEtf = /\.TO$/i.test(normalizedSymbol)

            return {
                asset_type: isEtf ? 'etf' : 'mutual_fund',
                symbol: normalizedSymbol,
                fund_code: isEtf ? null : normalizedSymbol,
                name: 'N/A',
                ai_reason: typeof reason === 'string' && reason.trim().length > 0 ? reason : null,
            }
        })

    return rows.length > 0 ? rows : null
}

async function enrichRecommendations(recommendations, deps = {}) {
    const {
        MutualFundModel = MutualFund,
        fetchAllETFsFn = () => etfHelpers.fetchAllETFs(),
        slimETFFn = slimETF,
    } = deps

    try {
        if (!recommendations || typeof recommendations !== 'object') {
            return null
        }

        const symbols = Object.keys(recommendations)
        if (symbols.length === 0) {
            return null
        }

        const etfCodes = symbols.filter((s) => /\.TO$/i.test(s))
        const mfCodes = symbols.filter((s) => !/\.TO$/i.test(s))

        const [mutualFunds, allETFsRaw] = await Promise.all([
            mfCodes.length > 0
                ? MutualFundModel.find({ fund_code: { $in: mfCodes } }).lean()
                : Promise.resolve([]),
            etfCodes.length > 0
                ? fetchAllETFsFn()
                : Promise.resolve([])
        ])

        const etfBySymbol = new Map(
            (Array.isArray(allETFsRaw) ? allETFsRaw : [])
                .filter((e) => e?.symbol)
                .map((e) => [String(e.symbol).toUpperCase(), e])
        )

        const matchedETFs = etfCodes
            .map((code) => etfBySymbol.get(String(code).toUpperCase()))
            .filter(Boolean)
            .map((etf) => slimETFFn(etf))

        const enrichedFunds = [
            ...(Array.isArray(mutualFunds) ? mutualFunds : []).map((f) => ({
                ...f,
                asset_type: 'mutual_fund',
                symbol: f?.fund_code || null,
                ai_reason: recommendations[f?.fund_code] || null,
            })),
            ...matchedETFs.map((e) => ({
                ...e,
                asset_type: 'etf',
                ai_reason: recommendations[e?.symbol] || null,
            }))
        ]

        return enrichedFunds.length > 0 ? enrichedFunds : null
    } catch (error) {
        console.error('[sendMessage] Recommendation enrichment failed:', error.message)
        return null
    }
}

/**
 * Resolve article chunk IDs from SOURCES JSON to URLs for client tables.
 * @returns {Array<{ id: string, chunkIndex: number, sourceUrl: string }>|null}
 */
async function enrichSources(sources, deps = {}) {
    const { ChunkModel = Chunk, mongooseLib = mongoose } = deps

    try {
        if (!sources || typeof sources !== 'object' || Array.isArray(sources)) {
            return null
        }

        const entries = Object.entries(sources)
        const ids = entries
            .map(([chunkId]) => chunkId)
            .filter((id) => mongooseLib.Types.ObjectId.isValid(id))

        if (ids.length === 0) {
            return null
        }

        const chunks = await ChunkModel.find({ _id: { $in: ids } })
            .select('_id source_url')
            .lean()

        const urlById = new Map(chunks.map((c) => [String(c._id), c.source_url]))

        const rows = entries
            .filter(([chunkId]) => mongooseLib.Types.ObjectId.isValid(chunkId) && urlById.has(String(chunkId)))
            .map(([chunkId, chunkIndex]) => ({
                id: String(chunkId),
                chunkIndex: Number(chunkIndex),
                sourceUrl: urlById.get(String(chunkId)),
            }))

        return rows.length > 0 ? rows : null
    } catch (error) {
        console.error('[enrichSources] Failed:', error.message)
        return null
    }
}

export function createChatService(deps = {}) {
    /** Last completed classification `response_mode` per chat session (general | narrow). */
    const lastResponseModeBySession = new Map()

    const {
        promptengineeringLib = promptengineering,
        classifyQueryFn = classifyQuery,
        reconstructContinuityContextFn = reconstructContinuityContext,
        MutualFundModel = MutualFund,
        ChunkModel = Chunk,
        fetchAllETFsFn = () => etfHelpers.fetchAllETFs(),
        slimETFFn = slimETF,
        MessageModel = Message,
        ProfileModel = Profile,
        randomUUIDFn = randomUUID,
        mongooseLib = mongoose,
        environment = ENVIRONMENT,
        aiClient = { generateAIResponse, generateAIResponseStream },
    } = deps

    async function buildPromptMessages({ message, userId, sessionId, sessionUserId, onStatus }) {
        if (typeof onStatus === 'function') {
            // Frontend uses status events to show progress before first streamed chunk.
            await onStatus('classifying')
        }

        const profileUserId = resolveProfileUserId(sessionUserId)
        const userProfile = await loadUserProfile(ProfileModel, profileUserId, mongooseLib)

        const fullHistory = sessionId
            ? await MessageModel.find({ sessionId })
                .sort({ createdAt: 1 })
                .select('role content')
                .lean()
            : []

        const classifierHistoryWindow = fullHistory.slice(-10)

        const previousResponseMode = sessionId ? lastResponseModeBySession.get(sessionId) ?? null : null
        const classification = await classifyQueryFn(message, userProfile, classifierHistoryWindow, {
            previousResponseMode,
        })
        let isContinuationForResponse = Boolean(classification.is_continuation)
        console.log('Classification result:', classification)

        if (classification.is_allowed === false) {
            if (typeof onStatus === 'function') {
                await onStatus('blocked')
            }
            return {
                blocked: true,
                blockMessage: environment.outOfScopeChatMessage,
                isContinuationForResponse: false,
            }
        }

        if (sessionId && classification.response_mode) {
            lastResponseModeBySession.set(sessionId, classification.response_mode)
        }

        if (typeof onStatus === 'function') {
            await onStatus('building_context')
        }

        const trimmedHistory = trimHistoryToTokenBudget(fullHistory, environment.historyTokenBudget, 20)
        const formattedHistory = formatHistoryForLLM(trimmedHistory)

        let messages

        if (classification.is_continuation && sessionId) {
            // CONTINUITY MODE — reconstruct context from prior messages
            console.log('[sendMessage] Continuity mode activated')

            const { funds, chunks, etfs, hasContext } = await reconstructContinuityContextFn(
                sessionId,
                MessageModel
            )

            if (hasContext) {
                const priorTypes = detectPriorAssetTypes(funds, etfs)
                const shouldReset = shouldResetContinuity(classification, priorTypes)

                if (shouldReset) {
                    console.log('[sendMessage] Continuity reset - asset type conflict detected, running full pipeline')
                    isContinuationForResponse = false
                    messages = await promptengineeringLib.generatePrompt(
                        message,
                        userId,
                        classification,
                        formattedHistory
                    )
                } else {
                    const missingNeededContext = []
                    if (classification.needs_articles) missingNeededContext.push('articles (fresh vector search)')
                    else if (chunks.length > 0) missingNeededContext.push('articles (session continuity only)')
                    if (classification.needs_funds && funds.length === 0) missingNeededContext.push('funds')
                    if (classification.needs_etfs && etfs.length === 0) missingNeededContext.push('etfs')

                    const continuityClassification = {
                        ...classification,
                        needs_articles: classification.needs_articles,
                        needs_funds: classification.needs_funds && funds.length === 0,
                        needs_etfs: classification.needs_etfs && etfs.length === 0,
                        needs_distribution_mutual_funds:
                            classification.needs_distribution_mutual_funds &&
                            classification.needs_funds &&
                            funds.length === 0,
                        _prefetchedFunds: funds,
                        _prefetchedChunks: chunks,
                        _prefetchedEtfs: etfs,
                    }

                    messages = await promptengineeringLib.generatePrompt(
                        message,
                        userId,
                        continuityClassification,
                        formattedHistory
                    )

                    if (missingNeededContext.length > 0) {
                        console.log(`[sendMessage] Continuity merge mode: injected ${funds.length} funds, ${etfs.length} etfs, ${chunks.length} chunks; fetching missing ${missingNeededContext.join(', ')}`)
                    } else {
                        console.log('[sendMessage] Continuity merge mode: fully served from reconstructed context')
                    }
                }
            } else {
                // No usable prior context found — fall back to full pipeline
                console.log('[sendMessage] Continuity mode: no usable prior context found, falling back to full pipeline')
                messages = await promptengineeringLib.generatePrompt(
                    message,
                    userId,
                    classification,
                    formattedHistory
                )
            }
        } else {
            // NORMAL MODE — full retrieval pipeline
            messages = await promptengineeringLib.generatePrompt(
                message,
                userId,
                classification,
                formattedHistory
            )
        }

        return {
            blocked: false,
            messages,
            isContinuationForResponse,
        }
    }

    async function persistMessages({ shouldStore, sessionUserId, message, sessionId, aiResponse }) {
        let savedUserMessage = null
        let savedAIMessage = null

        if (shouldStore) {
            console.log('Storing messages in database...')

            const currentSessionId = sessionId || randomUUIDFn()
            const effectiveUserId = sessionUserId

            savedUserMessage = await MessageModel.create({
                sender: effectiveUserId,
                content: message,
                sessionId: currentSessionId,
                role: 'user'
            })

            savedAIMessage = await MessageModel.create({
                sender: effectiveUserId,
                content: aiResponse,
                sessionId: currentSessionId,
                role: 'AI',
                reference: savedUserMessage._id.toString()
            })
        }

        return {
            savedUserMessage,
            savedAIMessage,
        }
    }

    async function sendMessage({ message, userId, sessionId, sessionUserId }) {
        const buildResult = await buildPromptMessages({
            message,
            userId,
            sessionId,
            sessionUserId,
        })

        if (buildResult.blocked) {
            return {
                success: true,
                blocked: true,
                response: buildResult.blockMessage,
                isContinuation: false,
                recommendations: null,
                enrichedFunds: null,
                stored: false,
                sessionId: undefined,
                messageIds: null,
            }
        }

        const { messages, isContinuationForResponse } = buildResult

        const aiResponse = await aiClient.generateAIResponse({
            systemPrompt: messages[0].content,
            userPrompt: messages[messages.length - 1].content,
            conversationHistory: messages.slice(1, -1),
            apiUrl: environment.aiGeneralUrl,
            apiKey: environment.aiGeneralApiKey,
            maxOutputTokens: environment.aiMaxTokens,
            temperature: environment.aiTemperature,
        })

        console.log('[sendMessage] Raw AI response:', aiResponse)

        const { message: parsedMessage, recommendations, sources } = parseAIResponse(aiResponse)
        console.log('[sendMessage] Parsed response - recommendations (raw):', recommendations)
        console.log('[sendMessage] Parsed response - sources (raw):', sources)

        const enrichedFunds = await enrichRecommendations(recommendations, {
            MutualFundModel,
            fetchAllETFsFn,
            slimETFFn,
        })
        const enrichedSources = await withTimeout(
            enrichSources(sources, { ChunkModel, mongooseLib }),
            250
        )

        const shouldStore = Boolean(sessionUserId)
        const { savedUserMessage, savedAIMessage } = await persistMessages({
            shouldStore,
            sessionUserId,
            message,
            sessionId,
            aiResponse,
        })

        return {
            success: true,
            blocked: false,
            response: parsedMessage,
            stored: shouldStore,
            sessionId: savedUserMessage?.sessionId,
            messageIds: shouldStore ? {
                userMessage: savedUserMessage._id,
                aiMessage: savedAIMessage._id
            } : null,
            isContinuation: isContinuationForResponse,
            recommendations: recommendations || null,
            sources: sources || null,
            enrichedFunds,
            enrichedSources: enrichedSources || null,
        }
    }

    async function sendMessageStream({ message, userId, sessionId, sessionUserId, onVisibleChunk, onStatus }) {
        const buildResult = await buildPromptMessages({
            message,
            userId,
            sessionId,
            sessionUserId,
            onStatus,
        })

        if (buildResult.blocked) {
            if (typeof onVisibleChunk === 'function') {
                await onVisibleChunk(buildResult.blockMessage)
            }
            return {
                success: true,
                blocked: true,
                response: buildResult.blockMessage,
                isContinuation: false,
                recommendations: null,
                sources: null,
                enrichedFunds: null,
                stored: false,
                sessionId: undefined,
                messageIds: null,
            }
        }

        const { messages, isContinuationForResponse } = buildResult

        if (typeof onStatus === 'function') {
            await onStatus('loading')
            await onStatus('start_streaming')
        }

        let aiResponse = ''
        let emittedChars = 0
        // Small holdback reduces the chance of leaking a partial metadata header
        // when the model starts emitting RECOMMENDATIONS/SOURCES near the end.
        const minHoldback = 48

        for await (const chunk of aiClient.generateAIResponseStream({
            systemPrompt: messages[0].content,
            userPrompt: messages[messages.length - 1].content,
            conversationHistory: messages.slice(1, -1),
            apiUrl: environment.aiGeneralUrl,
            apiKey: environment.aiGeneralApiKey,
            maxOutputTokens: environment.aiMaxTokens,
            temperature: environment.aiTemperature,
        })) {
            aiResponse += chunk

            const metadataStart = findMetadataStartIndex(aiResponse)
            const visibleLimit = metadataStart >= 0
                ? metadataStart
                : Math.max(0, aiResponse.length - minHoldback)

            if (visibleLimit > emittedChars) {
                const visibleChunk = aiResponse.slice(emittedChars, visibleLimit)
                emittedChars = visibleLimit
                if (visibleChunk && typeof onVisibleChunk === 'function') {
                    await onVisibleChunk(visibleChunk)
                }
            }
        }

        if (!aiResponse || !aiResponse.trim()) {
            // Safety net: if stream transport yields no text, use the regular API path
            // so the request still succeeds and persistence remains valid.
            console.warn('[sendMessageStream] Empty streamed response received; falling back to non-stream generation')
            aiResponse = await aiClient.generateAIResponse({
                systemPrompt: messages[0].content,
                userPrompt: messages[messages.length - 1].content,
                conversationHistory: messages.slice(1, -1),
                apiUrl: environment.aiGeneralUrl,
                apiKey: environment.aiGeneralApiKey,
                maxOutputTokens: environment.aiMaxTokens,
                temperature: environment.aiTemperature,
            })
        }

        console.log('[sendMessageStream] Raw AI response:', aiResponse)

        const { message: parsedMessage, recommendations, sources } = parseAIResponse(aiResponse)
        console.log('[sendMessageStream] Parsed response - recommendations (raw):', recommendations)
        console.log('[sendMessageStream] Parsed response - sources (raw):', sources)

        if (typeof onVisibleChunk === 'function') {
            const alreadyVisibleText = aiResponse.slice(0, emittedChars)
            const remainingVisibleText = parsedMessage.startsWith(alreadyVisibleText)
                ? parsedMessage.slice(alreadyVisibleText.length)
                : parsedMessage

            if (remainingVisibleText) {
                await onVisibleChunk(remainingVisibleText)
            }
        }

        const shouldStore = Boolean(sessionUserId)
        const persistPromise = persistMessages({
            shouldStore,
            sessionUserId,
            message,
            sessionId,
            aiResponse,
        })

        const lightweightFunds = buildLightweightRecommendationRows(recommendations)
        const enrichedFunds = await withTimeout(enrichRecommendations(recommendations, {
            MutualFundModel,
            fetchAllETFsFn,
            slimETFFn,
        }), 250)
        const enrichedSources = await withTimeout(
            enrichSources(sources, { ChunkModel, mongooseLib }),
            250
        )

        const { savedUserMessage, savedAIMessage } = await persistPromise

        return {
            success: true,
            blocked: false,
            response: parsedMessage,
            stored: shouldStore,
            sessionId: savedUserMessage?.sessionId,
            messageIds: shouldStore ? {
                userMessage: savedUserMessage._id,
                aiMessage: savedAIMessage._id
            } : null,
            isContinuation: isContinuationForResponse,
            recommendations: recommendations || null,
            sources: sources || null,
            enrichedFunds: enrichedFunds || lightweightFunds,
            enrichedSources: enrichedSources || null,
        }
    }

    async function getUserChatHistory({ sessionUserId }) {
        const sessions = await MessageModel.aggregate([
            {
                $match: {
                    sender: new mongooseLib.Types.ObjectId(sessionUserId),
                    sessionId: { $exists: true, $ne: null }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$sessionId',
                    latestMessage: { $first: '$$ROOT' },
                    messageCount: { $sum: 1 },
                    lastUpdated: { $first: '$createdAt' }
                }
            },
            {
                $sort: { lastUpdated: -1 }
            },
            {
                $limit: 50
            }
        ])

        return sessions.map(session => ({
            sessionId: session._id,
            title: session.latestMessage.content.substring(0, 50) + (session.latestMessage.content.length > 50 ? '...' : ''),
            date: session.lastUpdated.toLocaleDateString(),
            messageCount: session.messageCount
        }))
    }

    async function getSessionMessages({ sessionId, sessionUserId }) {
        const hasAccess = await assertSessionOwnership(MessageModel, sessionId, sessionUserId, mongooseLib)
        if (!hasAccess) {
            return { forbidden: true, messages: [] }
        }

        const rawMessages = await MessageModel.find({ sessionId })
            .sort({ createdAt: 1 })
            .select('_id role content createdAt')
            .lean()

        const allChunkIds = new Set()
        for (const msg of rawMessages) {
            if (msg.role !== 'AI') continue
            const parsed = parseAIResponse(msg.content)
            if (parsed.sources && typeof parsed.sources === 'object') {
                for (const k of Object.keys(parsed.sources)) {
                    if (mongooseLib.Types.ObjectId.isValid(k)) {
                        allChunkIds.add(k)
                    }
                }
            }
        }

        const uniqueChunkIds = [...allChunkIds]
        const chunkDocs = uniqueChunkIds.length > 0
            ? await ChunkModel.find({ _id: { $in: uniqueChunkIds } }).select('_id source_url').lean()
            : []
        const urlById = new Map(chunkDocs.map((c) => [String(c._id), c.source_url]))

        function sourcesToRows(sources) {
            if (!sources || typeof sources !== 'object') return null
            const rows = []
            for (const [chunkId, chunkIndex] of Object.entries(sources)) {
                if (!mongooseLib.Types.ObjectId.isValid(chunkId)) continue
                const url = urlById.get(String(chunkId))
                if (url) {
                    rows.push({
                        id: String(chunkId),
                        chunkIndex: Number(chunkIndex),
                        sourceUrl: url,
                    })
                }
            }
            return rows.length > 0 ? rows : null
        }

        const messagesOut = await Promise.all(rawMessages.map(async (msg) => {
            if (msg.role === 'user') {
                return {
                    id: String(msg._id),
                    role: 'user',
                    content: msg.content,
                    timestamp: msg.createdAt,
                }
            }

            const parsed = parseAIResponse(msg.content)
            const enrichedFunds = parsed.recommendations
                ? await withTimeout(
                    enrichRecommendations(parsed.recommendations, {
                        MutualFundModel,
                        fetchAllETFsFn,
                        slimETFFn,
                    }),
                    250
                )
                : null
            const lightweightFunds = buildLightweightRecommendationRows(parsed.recommendations)
            const fundsFinal = enrichedFunds?.length ? enrichedFunds : lightweightFunds

            return {
                id: String(msg._id),
                role: 'AI',
                content: parsed.message,
                timestamp: msg.createdAt,
                enrichedFunds: fundsFinal?.length ? fundsFinal : null,
                enrichedSources: sourcesToRows(parsed.sources),
            }
        }))

        return {
            forbidden: false,
            messages: messagesOut,
        }
    }

    async function deleteSession({ sessionId, sessionUserId }) {
        const hasAccess = await assertSessionOwnership(MessageModel, sessionId, sessionUserId, mongooseLib)
        if (!hasAccess) {
            return { forbidden: true, notFound: false, deletedCount: 0 }
        }

        const result = await MessageModel.deleteMany({
            sessionId,
            sender: new mongooseLib.Types.ObjectId(sessionUserId)
        })

        if (!result.deletedCount) {
            return { forbidden: false, notFound: true, deletedCount: 0 }
        }

        return {
            forbidden: false,
            notFound: false,
            deletedCount: result.deletedCount
        }
    }

    return {
        sendMessage,
        sendMessageStream,
        getUserChatHistory,
        getSessionMessages,
        deleteSession,
        loadUserProfile,
    }
}
