import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { createChatController } from '../../controllers/chatController.js'

function createRes() {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe('chatController', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('getSessionMessages returns 400 when sessionId is missing', async () => {
        const controller = createChatController({ getSessionMessages: jest.fn() })
        const req = { params: {}, session: {} }
        const res = createRes()

        await controller.getSessionMessages(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ error: 'Session ID is required' })
    })

    test('getSessionMessages succeeds when session userId is absent', async () => {
        const chatService = {
            getSessionMessages: jest.fn().mockResolvedValue({ forbidden: false, messages: [{ message: 'hello' }] })
        }
        const controller = createChatController(chatService)
        const req = { params: { sessionId: 's1' }, session: {} }
        const res = createRes()

        await controller.getSessionMessages(req, res)

        expect(chatService.getSessionMessages).toHaveBeenCalledWith({
            sessionId: 's1',
            sessionUserId: undefined,
        })
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            messages: [{ message: 'hello' }],
        })
    })

    test('deleteSession returns 400 when sessionId is missing', async () => {
        const controller = createChatController({ deleteSession: jest.fn() })
        const req = { params: {}, session: { userId: '507f1f77bcf86cd799439011' } }
        const res = createRes()

        await controller.deleteSession(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ error: 'Session ID is required' })
    })

    test('deleteSession returns 401 when user is not authenticated', async () => {
        const controller = createChatController({ deleteSession: jest.fn() })
        const req = { params: { sessionId: 's1' }, session: {} }
        const res = createRes()

        await controller.deleteSession(req, res)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' })
    })

    test('deleteSession returns 403 when service says forbidden', async () => {
        const chatService = { deleteSession: jest.fn().mockResolvedValue({ forbidden: true }) }
        const controller = createChatController(chatService)
        const req = { params: { sessionId: 's1' }, session: { userId: '507f1f77bcf86cd799439011' } }
        const res = createRes()

        await controller.deleteSession(req, res)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({ error: 'You do not have access to this session' })
    })

    test('deleteSession returns 404 when session not found', async () => {
        const chatService = { deleteSession: jest.fn().mockResolvedValue({ forbidden: false, notFound: true, deletedCount: 0 }) }
        const controller = createChatController(chatService)
        const req = { params: { sessionId: 's1' }, session: { userId: '507f1f77bcf86cd799439011' } }
        const res = createRes()

        await controller.deleteSession(req, res)

        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({ error: 'Session not found' })
    })

    test('deleteSession returns 200 on success', async () => {
        const chatService = { deleteSession: jest.fn().mockResolvedValue({ forbidden: false, notFound: false, deletedCount: 2 }) }
        const controller = createChatController(chatService)
        const req = { params: { sessionId: 's1' }, session: { userId: '507f1f77bcf86cd799439011' } }
        const res = createRes()

        await controller.deleteSession(req, res)

        expect(chatService.deleteSession).toHaveBeenCalledWith({ sessionId: 's1', sessionUserId: '507f1f77bcf86cd799439011' })
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            sessionId: 's1',
            deletedCount: 2
        })
    })
})
