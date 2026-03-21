import { describe, test, expect, jest, beforeEach, afterAll, afterEach } from '@jest/globals'
import { createAccountService } from '../../services/account/accountService.js'

describe('accountService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('creates a local account and sends verification email for valid signup input', async () => {
        // Arrange
        const fakeAccountModel = {
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ _id: 'u1' })
        }
        const fakeBcrypt = {
            genSalt: jest.fn().mockResolvedValue('salt'),
            hash: jest.fn().mockResolvedValue('hashed-password')
        }
        const fakeJwt = { sign: jest.fn().mockReturnValue('token') }
        const fakeSendVerificationEmail = jest.fn()
        const service = createAccountService({
            AccountModel: fakeAccountModel,
            bcryptLib: fakeBcrypt,
            jwtLib: fakeJwt,
            sendVerificationEmailFn: fakeSendVerificationEmail,
            environment: { jwtSecret: 'secret' }
        })

        // Act
        const result = await service.localSignup({ email: 'user@example.com', name: 'User', password: 'pw' })

        // Assert
        expect(result).toHaveProperty('user')
        expect(result.response.message).toContain('successfully registered')
        expect(fakeAccountModel.create).toHaveBeenCalledTimes(1)
        expect(fakeSendVerificationEmail).toHaveBeenCalledWith('user@example.com', 'token')
    })

    test('rejects signup when email is already registered', async () => {
        // Arrange
        const fakeAccountModel = {
            findOne: jest.fn().mockResolvedValue({ _id: 'existing' })
        }
        const service = createAccountService({ AccountModel: fakeAccountModel })

        // Act
        const action = service.localSignup({ email: 'user@example.com', name: 'User', password: 'pw' })

        // Assert
        await expect(action).rejects.toMatchObject({ status: 400 })
        expect(fakeAccountModel.findOne).toHaveBeenCalledTimes(1)
    })

    test('authenticates local login when password matches', async () => {
        // Arrange
        const fakeAccountModel = {
            findOne: jest.fn().mockResolvedValue({ authType: 'local', password: 'hashed' })
        }
        const fakeBcrypt = { compare: jest.fn().mockResolvedValue(true) }
        const service = createAccountService({ AccountModel: fakeAccountModel, bcryptLib: fakeBcrypt })

        // Act
        const result = await service.localLogin({ email: 'user@example.com', password: 'pw' })

        // Assert
        expect(result.response.message).toBe('Logged in successfully')
        expect(fakeBcrypt.compare).toHaveBeenCalledTimes(1)
    })

    test('rejects login when account is missing', async () => {
        // Arrange
        const fakeAccountModel = { findOne: jest.fn().mockResolvedValue(null) }
        const service = createAccountService({ AccountModel: fakeAccountModel })

        // Act
        const action = service.localLogin({ email: 'missing@example.com', password: 'pw' })

        // Assert
        await expect(action).rejects.toMatchObject({ status: 400 })
        expect(fakeAccountModel.findOne).toHaveBeenCalledTimes(1)
    })

    test('rejects login when password is incorrect', async () => {
        // Arrange
        const fakeAccountModel = { findOne: jest.fn().mockResolvedValue({ authType: 'local', password: 'hashed' }) }
        const fakeBcrypt = { compare: jest.fn().mockResolvedValue(false) }
        const service = createAccountService({ AccountModel: fakeAccountModel, bcryptLib: fakeBcrypt })

        // Act
        const action = service.localLogin({ email: 'user@example.com', password: 'bad' })

        // Assert
        await expect(action).rejects.toMatchObject({ status: 401 })
        expect(fakeBcrypt.compare).toHaveBeenCalledTimes(1)
    })

    test('returns auth payload for authenticated session', () => {
        // Arrange
        const service = createAccountService()
        const session = { userId: 'u1', email: 'user@example.com', name: 'U', picture: 'p', isVerified: true }

        // Act
        const result = service.checkUserAuth(session)

        // Assert
        expect(result.userId).toBe('u1')
        expect(result.isVerified).toBe(true)
    })

    test('throws unauthorized when session has no userId', () => {
        // Arrange
        const service = createAccountService()

        // Act
        const action = () => service.checkUserAuth({})

        // Assert
        expect(action).toThrow('User not authenticated')
    })
})
