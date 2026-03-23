import { Profile } from '../../models/profile.js'

const SECTION_MAPPING = {
    general: [
        'income_stability',
        'employment_status',
        'risk_tolerance',
        'investment_experience',
        'financial_goal',
        'housing_status',
        'monthly_income',
        'savings_balance',
        'debt_amount',
        'has_TFSA',
        'investment_preference',
    ],
}

const ALL_FIELDS = Object.values(SECTION_MAPPING).flat()

const FIELD_TO_SECTION = {}
for (const [section, fields] of Object.entries(SECTION_MAPPING)) {
    fields.forEach((field) => {
        FIELD_TO_SECTION[field] = section
    })
}

const QUESTION_META = {
    income_stability: { prompt: 'How stable is your income?' },
    employment_status: { prompt: 'What is your current employment status?' },
    risk_tolerance: { prompt: 'How much risk are you comfortable with?' },
    investment_experience: { prompt: 'What is your level of investing experience?' },
    financial_goal: { prompt: 'What is your primary financial goal?' },
    housing_status: { prompt: 'What is your current housing situation?' },
    monthly_income: {
        prompt: 'What is your approximate monthly income (CAD)?',
        placeholder: 'e.g., 3000',
    },
    savings_balance: {
        prompt: 'What is your current savings balance (CAD)?',
        placeholder: 'e.g., 5000',
    },
    debt_amount: {
        prompt: 'What is your total debt amount (CAD)?',
        placeholder: 'e.g., 10000',
    },
    investment_preference: {
        prompt: 'What type of investments do you prefer?',
    },
}

function isUnanswered(profile, field) {
    const v = profile[field]
    return v == null || (typeof v === 'string' && v.trim() === '')
}

function pickRandom(items, k) {
    const arr = [...items]
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr.slice(0, k)
}

function titleFromField(field) {
    return field
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
}

function defaultPrompt(title) {
    return `Please answer: ${title}`
}

export function createProfileService(deps = {}) {
    const {
        ProfileModel = Profile,
        randomPicker = pickRandom,
    } = deps

    function buildQuestionFromSchema(field) {
        const path = ProfileModel.schema.path(field)
        if (!path) return null

        const title = QUESTION_META[field]?.title || titleFromField(field)
        const prompt = QUESTION_META[field]?.prompt || defaultPrompt(title)
        const section = FIELD_TO_SECTION[field] || 'general'

        const enumValues = Array.isArray(path.enumValues) ? path.enumValues : []
        const isNumber = path.instance === 'Number'

        if (enumValues.length > 0) {
            return {
                field,
                type: 'mcq',
                title,
                prompt,
                section,
                options: enumValues,
            }
        }

        return {
            field,
            type: 'fill',
            title,
            prompt,
            section,
            inputType: isNumber ? 'number' : 'text',
            placeholder:
                QUESTION_META[field]?.placeholder ||
                (isNumber ? 'e.g., 3000' : 'Type your answer...'),
        }
    }

    async function findOrCreateProfile(userId) {
        let profile = await ProfileModel.findOne({ userId })
        if (!profile) profile = await ProfileModel.create({ userId })
        return profile
    }

    async function getProfile(userId) {
        return findOrCreateProfile(userId)
    }

    async function patchProfile(userId, body) {
        const updates = {}
        for (const key of ALL_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(body, key)) {
                updates[key] = body[key]
            }
        }

        if (Object.keys(updates).length === 0) {
            const error = new Error('No valid fields provided.')
            error.status = 400
            throw error
        }

        return ProfileModel.findOneAndUpdate(
            { userId },
            { $set: updates },
            { new: true, upsert: true, runValidators: true }
        )
    }

    async function getRandomUnanswered(userId) {
        const profile = await findOrCreateProfile(userId)
        const unanswered = ALL_FIELDS.filter((f) => isUnanswered(profile, f))

        const pickedFields = randomPicker(unanswered, Math.min(3, unanswered.length))
        const questions = pickedFields.map(buildQuestionFromSchema).filter(Boolean)

        return {
            questions,
            pickedFields,
            remainingUnansweredCount: unanswered.length,
        }
    }

    function getAllFields() {
        const questions = ALL_FIELDS.map(buildQuestionFromSchema).filter(Boolean)

        return {
            questions,
            total: questions.length,
        }
    }

    return {
        getProfile,
        patchProfile,
        getRandomUnanswered,
        getAllFields,
    }
}
