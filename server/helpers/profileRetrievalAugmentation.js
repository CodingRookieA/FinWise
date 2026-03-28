/**
 * Builds an embedding query for article vector search, biasing toward the user's profile
 * (general/educational mode). The user's question stays first so the topic dominates retrieval.
 */

const AGE_LIFE_STAGE = {
    'Under 25': 'early-career / young adult investor',
    '25-44': 'mid-career investor',
    '45-64': 'pre-retirement investor',
    '65+': 'retirement-age investor',
}

/**
 * @param {string} userInput
 * @param {object|null|undefined} profile - lean Profile doc or plain object
 * @returns {string}
 */
export function buildArticleRetrievalQuery(userInput, profile) {
    const q = String(userInput || '').trim()
    if (!profile || typeof profile !== 'object') return q

    const parts = [q]

    if (profile.age && AGE_LIFE_STAGE[profile.age]) {
        parts.push(`Relevant context: ${AGE_LIFE_STAGE[profile.age]}.`)
    }
    if (profile.financial_goal) {
        parts.push(`Financial goal context: ${profile.financial_goal}.`)
    }
    if (profile.risk_tolerance) {
        parts.push(`Risk context: ${profile.risk_tolerance}.`)
    }

    return parts.join('\n')
}
