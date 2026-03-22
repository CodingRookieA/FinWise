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
})
