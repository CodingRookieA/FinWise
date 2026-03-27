import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { createProfileService } from '../../services/profile/profileService.js'

describe('profileService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    function makeSchema() {
        return {
            path: jest.fn((field) => {
                if (['income_stability', 'employment_status', 'risk_tolerance', 'investment_experience', 'financial_goal', 'housing_status', 'has_TFSA', 'investment_preference'].includes(field)) {
                    return { enumValues: ['A', 'B'], instance: 'String' }
                }
                if (['monthly_income', 'savings_balance', 'debt_amount'].includes(field)) {
                    return { enumValues: [], instance: 'Number' }
                }
                return { enumValues: [], instance: 'String' }
            })
        }
    }

    test('returns existing profile when profile already exists', async () => {
        // Arrange
        const existing = { userId: 'u1' }
        const fakeProfileModel = { schema: makeSchema(), findOne: jest.fn().mockResolvedValue(existing), create: jest.fn() }
        const service = createProfileService({ ProfileModel: fakeProfileModel })

        // Act
        const result = await service.getProfile('u1')

        // Assert
        expect(result).toBe(existing)
        expect(fakeProfileModel.create).not.toHaveBeenCalled()
    })

    test('creates profile when profile is missing', async () => {
        // Arrange
        const fakeProfileModel = {
            schema: makeSchema(),
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ userId: 'u1' })
        }
        const service = createProfileService({ ProfileModel: fakeProfileModel })

        // Act
        const result = await service.getProfile('u1')

        // Assert
        expect(result.userId).toBe('u1')
        expect(fakeProfileModel.create).toHaveBeenCalledWith({ userId: 'u1' })
    })

    test('patches only allowed fields', async () => {
        // Arrange
        const fakeProfileModel = {
            schema: makeSchema(),
            findOneAndUpdate: jest.fn().mockResolvedValue({ userId: 'u1' })
        }
        const service = createProfileService({ ProfileModel: fakeProfileModel })

        // Act
        const result = await service.patchProfile('u1', { employment_status: 'A', unknown: 'X' })

        // Assert
        expect(result.userId).toBe('u1')
        expect(fakeProfileModel.findOneAndUpdate).toHaveBeenCalledTimes(1)
    })

    test('rejects patch when body has no valid fields', async () => {
        // Arrange
        const fakeProfileModel = { schema: makeSchema() }
        const service = createProfileService({ ProfileModel: fakeProfileModel })

        // Act
        const action = service.patchProfile('u1', { unknown: 'X' })

        // Assert
        await expect(action).rejects.toMatchObject({ status: 400 })
    })

    test('returns up to two random unanswered questions', async () => {
        // Arrange
        const fakeProfile = {
            income_stability: null,
            employment_status: null,
            risk_tolerance: null,
            investment_experience: 'A',
            financial_goal: 'A',
            housing_status: 'A',
            monthly_income: 10,
            savings_balance: 10,
            debt_amount: 10,
            has_TFSA: 'A',
            investment_preference: 'A'
        }
        const fakeProfileModel = {
            schema: makeSchema(),
            findOne: jest.fn().mockResolvedValue(fakeProfile),
            create: jest.fn().mockResolvedValue(fakeProfile)
        }
        const randomPicker = jest.fn((items, k) => items.slice(0, k))
        const service = createProfileService({ ProfileModel: fakeProfileModel, randomPicker })

        // Act
        const result = await service.getRandomUnanswered('u1')

        // Assert
        expect(result.questions.length).toBe(2)
        expect(randomPicker).toHaveBeenCalledTimes(1)
    })

    test('returns all question metadata for questionnaire', () => {
        // Arrange
        const fakeProfileModel = { schema: makeSchema() }
        const service = createProfileService({ ProfileModel: fakeProfileModel })

        // Act
        const result = service.getAllFields()

        // Assert
        expect(result.total).toBeGreaterThan(0)
        expect(result.questions[0]).toHaveProperty('field')
    })
})
