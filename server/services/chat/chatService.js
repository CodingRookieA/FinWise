import promptengineering from '../../helpers/promptengineering.js'
import { classifyQuery } from '../../helpers/classifier.js'
import Message from '../../models/Message.js'
import { Profile } from '../../models/profile.js'
import { randomUUID } from 'crypto'
import mongoose from 'mongoose'
import { ENVIRONMENT } from '../../utils/constants.js'
import { generateAIResponse } from '../../clients/aiClient.js'
import { trimHistoryToTokenBudget, formatHistoryForLLM } from '../history/historyService.js'
import { parseAIResponse } from '../../helpers/responseParser.js'

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

export function createChatService(deps = {}) {
    const {
        promptengineeringLib = promptengineering,
        classifyQueryFn = classifyQuery,
        MessageModel = Message,
        ProfileModel = Profile,
        randomUUIDFn = randomUUID,
        mongooseLib = mongoose,
        environment = ENVIRONMENT,
        aiClient = { generateAIResponse },
    } = deps

    async function sendMessage({ message, userId, sessionId, sessionUserId }) {
        const profileUserId = resolveProfileUserId(sessionUserId)
        const userProfile = await loadUserProfile(ProfileModel, profileUserId, mongooseLib)

        const classification = await classifyQueryFn(message, userProfile)
        console.log('Classification result:', classification)

        const fullHistory = sessionId
            ? await MessageModel.find({ sessionId })
                .sort({ createdAt: 1 })
                .select('role content')
                .lean()
            : []

        const trimmedHistory = trimHistoryToTokenBudget(fullHistory, environment.historyTokenBudget, 20)

        const formattedHistory = formatHistoryForLLM(trimmedHistory)

        const messages = await promptengineeringLib.generatePrompt(
            message,
            userId,
            classification,
            formattedHistory
        )

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
        console.log('[sendMessage] Parsed response - recommendations:', recommendations ? Object.keys(recommendations) : 'none')
        console.log('[sendMessage] Parsed response - sources:', sources ? Object.keys(sources).length + ' chunks' : 'none')

        const shouldStore = Boolean(sessionUserId)
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
            success: true,
            response: parsedMessage,
            stored: shouldStore,
            sessionId: savedUserMessage?.sessionId,
            messageIds: shouldStore ? {
                userMessage: savedUserMessage._id,
                aiMessage: savedAIMessage._id
            } : null
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

        const messages = await MessageModel.find({ sessionId })
            .sort({ createdAt: 1 })
            .select('role content createdAt')

        return {
            forbidden: false,
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.createdAt
            }))
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
        getUserChatHistory,
        getSessionMessages,
        deleteSession,
        loadUserProfile,
    }
}
