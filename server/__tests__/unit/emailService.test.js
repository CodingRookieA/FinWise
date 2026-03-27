import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { createEmailService } from '../../services/email/emailService.js'

describe('emailService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('verifies email token and marks user as verified', async () => {
        // Arrange
        const save = jest.fn().mockResolvedValue(undefined)
        const fakeUser = { isVerified: false, save }
        const fakeAccountModel = { findOne: jest.fn().mockResolvedValue(fakeUser) }
        const fakeJwt = { verify: jest.fn((token, secret, callback) => callback(null, { email: 'user@example.com' })) }
        const service = createEmailService({ AccountModel: fakeAccountModel, jwtLib: fakeJwt, environment: { jwtSecret: 'secret' } })

        // Act
        const result = await service.verifyEmailToken('token')

        // Assert
        expect(result.response.message).toBe('Successfully verified email')
        expect(save).toHaveBeenCalledTimes(1)
    })

    test('rejects verification when token is invalid', async () => {
        // Arrange
        const fakeJwt = { verify: jest.fn((token, secret, callback) => callback(new Error('bad token'))) }
        const service = createEmailService({ jwtLib: fakeJwt, environment: { jwtSecret: 'secret' } })

        // Act
        const action = service.verifyEmailToken('bad')

        // Assert
        await expect(action).rejects.toMatchObject({ status: 400 })
    })

    test('rejects verification when user is already verified', async () => {
        // Arrange
        const fakeAccountModel = { findOne: jest.fn().mockResolvedValue({ isVerified: true }) }
        const fakeJwt = { verify: jest.fn((token, secret, callback) => callback(null, { email: 'user@example.com' })) }
        const service = createEmailService({ AccountModel: fakeAccountModel, jwtLib: fakeJwt, environment: { jwtSecret: 'secret' } })

        // Act
        const action = service.verifyEmailToken('token')

        // Assert
        await expect(action).rejects.toMatchObject({ status: 400 })
    })

    test('sends verification email for authenticated unverified user', async () => {
        // Arrange
        const fakeAccountModel = { findById: jest.fn().mockResolvedValue({ email: 'user@example.com', isVerified: false }) }
        const fakeJwt = { sign: jest.fn().mockReturnValue('jwt-token') }
        const fakeSendVerificationEmail = jest.fn()
        const service = createEmailService({
            AccountModel: fakeAccountModel,
            jwtLib: fakeJwt,
            sendVerificationEmailFn: fakeSendVerificationEmail,
            environment: { jwtSecret: 'secret' }
        })

        // Act
        const result = await service.sendVerification('u1')

        // Assert
        expect(result.message).toBe('Verification email sent')
        expect(fakeSendVerificationEmail).toHaveBeenCalledWith('user@example.com', 'jwt-token')
    })

    test('rejects sendVerification when session user is null', async () => {
        // Arrange
        const service = createEmailService()

        // Act
        const action = service.sendVerification(null)

        // Assert
        await expect(action).rejects.toMatchObject({ status: 401 })
    })
})
