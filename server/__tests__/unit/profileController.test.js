import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { createProfileController } from '../../controllers/profile.js'

function createRes() {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe('profileController', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('getProfile returns 401 when session has no userId', async () => {
        const controller = createProfileController({ getProfile: jest.fn() })
        const req = { session: {} }
        const res = createRes()

        await controller.getProfile(req, res)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'Not logged in' })
    })

    test('patchProfile returns 401 when session has no userId', async () => {
        const controller = createProfileController({ patchProfile: jest.fn() })
        const req = { session: {}, body: { risk_tolerance: 'low' } }
        const res = createRes()

        await controller.patchProfile(req, res)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'Not logged in' })
    })

    test('getRandomUnanswered returns 401 when session has no userId', async () => {
        const controller = createProfileController({ getRandomUnanswered: jest.fn() })
        const req = { session: {} }
        const res = createRes()

        await controller.getRandomUnanswered(req, res)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'Not logged in' })
    })
})
