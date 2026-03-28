import mongoose from 'mongoose'

const ProfileSchema = new mongoose.Schema(
    {
        // userId:{
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'FinWise-accounts',
        //     required: true
        // }

        userId:{
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            unique: true,
            index: true,
            ref: 'Account',
        },

        age: {
            type: String,
            enum: ['Under 25', '25-44', '45-64', '65+'],
            default: null,
            trim: true,
        },

        // mp questions
        income_stability:{
            type: String,
            enum: ['stable', 'unstable', 'seasonal', 'other'],
            default: null,
            trim: true,
        },
        employment_status: {
            type: String,
            enum: ["employed","unemployed", "student", "other"],
            default: null,
            trim: true,
        },
        risk_tolerance: {
            type: String,
            enum: ["low", "medium", "high", "none"],
            default: null,
            trim: true,
        },
        investment_experience: {
            type: String,
            enum: [
                "none", 
                "beginner", 
                "intermediate", 
                "advanced"
            ],
            default: null,
            trim: true,
        },
        financial_goal: {
            type: String,
            enum: [
                "house", 
                "car", 
                "grow wealth", 
                "other"
            ],
            default: null,
            trim: true,
        },
        housing_status: {
            type: String,
            enum: [
                "rent",
                "own with mortgage",
                "own no mortgage",
                "other",
            ],
            default: null,
            trim: true,
        },
        has_TFSA: {
            type: String,
            enum: [
                "yes",
                "no",
            ],
            default: null,
            trim: true,
        },
        investment_preference: {
            type: String,
            enum: [
                "ETFs",
                "mutual funds",
                "Both ETFs and mutual funds",
            ],
            default: null,
            trim: true,
        },
        //fill_in questions
        monthly_income:{
            type: Number,
            default: null,
        },
        savings_balance: {
            type: Number,
            default: null,
        },
        debt_amount: {
            type: Number,
            default: null,
        },
    },
    { timestamps: true }
)

export const Profile  = mongoose.model("Profile", ProfileSchema)
