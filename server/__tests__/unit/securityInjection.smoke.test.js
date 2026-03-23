/**
 * Smoke tests for NoSQL-style injection payloads on the account service.
 * The stack uses MongoDB (not SQL); these tests document behavior when
 * request fields are shaped like MongoDB query operators.
 */
import { describe, test, expect, jest } from '@jest/globals'
import bcrypt from 'bcrypt'
import { createAccountService } from '../../services/account/accountService.js'

describe('security injection smoke (NoSQL-style payloads)', () => {
    test('localLogin with operator-shaped email does not yield success when no user matches', async () => {
        const findOne = jest.fn().mockResolvedValue(null)
        const service = createAccountService({ AccountModel: { findOne } })

        await expect(service.localLogin({ email: { $gt: '' }, password: 'x' })).rejects.toMatchObject({
            status: 400
        })
        expect(findOne).toHaveBeenCalledWith({ email: { $gt: '' } })
    })

    test('localLogin with operator-shaped email still enforces password when a user document is returned', async () => {
        const hash = await bcrypt.hash('realpassword', 4)
        const findOne = jest.fn().mockResolvedValue({
            _id: 'u1',
            email: 'a@b.com',
            password: hash,
            authType: 'local'
        })
        const service = createAccountService({ AccountModel: { findOne } })

        await expect(service.localLogin({ email: { $gt: '' }, password: 'wrong' })).rejects.toMatchObject({
            status: 401
        })
    })

    test('localSignup passes operator-shaped email to findOne when checking duplicates', async () => {
        const findOne = jest.fn().mockResolvedValue({ email: 'taken@example.com' })
        const service = createAccountService({ AccountModel: { findOne } })

        await expect(
            service.localSignup({ email: { $ne: null }, name: 'X', password: 'Password123!' })
        ).rejects.toMatchObject({ status: 400 })

        expect(findOne).toHaveBeenCalledWith({ email: { $ne: null } })
    })
})
