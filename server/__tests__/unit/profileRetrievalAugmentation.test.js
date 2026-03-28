import { describe, test, expect } from '@jest/globals'
import { buildArticleRetrievalQuery } from '../../helpers/profileRetrievalAugmentation.js'

describe('profileRetrievalAugmentation', () => {
    test('returns user input when profile is null', () => {
        expect(buildArticleRetrievalQuery('What is a TFSA?', null)).toBe('What is a TFSA?')
    })

    test('appends life-stage and goal context from profile', () => {
        const q = buildArticleRetrievalQuery('How should I invest?', {
            age: '25-44',
            financial_goal: 'grow wealth',
            risk_tolerance: 'medium',
        })
        expect(q).toContain('How should I invest?')
        expect(q).toContain('mid-career investor')
        expect(q).toContain('grow wealth')
        expect(q).toContain('medium')
    })
})
