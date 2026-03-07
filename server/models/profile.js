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
        has_mutual_funds: {
            type: String,
            enum: [
                "yes",
                "no",
            ],
            default: null,
            trim: true,
        },
        has_ETFs: {
            type: String,
            enum: [
                "yes",
                "no",
            ],
            default: null,
            trim: true,
        },
        where_mutual_funds: {
            type: String,
            enum: [
                "TFSA",
                "RRSP",
                "FHSA",
                "RESP",
                "other",
            ],
            default: null,
            trim: true,
        },
        where_ETFs: {
            type: String,
            enum: [
                "TFSA",
                "RRSP",
                "FHSA",
                "RESP",
                "other",
            ],
            default: null,
            trim: true,
        },
        type_mutual_funds: {
            type: String,
            enum: [
                "index",
                "passive",
                "active",
                "mix",
            ],
            default: null,
            trim: true,
        },
        type_ETFs: {
            type: String,
            enum: [
                "broad market (all-in-one / index)",
                "sector (tech, energy, etc.)",
                "dividend",
                "bond ETF",
                "mix",
            ],
            default: null,
            trim: true,
        },
        fee_level_mutual_funds: {
            type: String,
            enum: [
                "<0.25%",
                "0.25–0.75%",
                "0.75–1.5%",
                ">1.5%",
                "not sure",
            ],
            default: null,
            trim: true,
        },
        frequency_ETFs: {
            type: String,
            enum: [
                "monthly",
                "sometimes",
                "rarely",
                "not currently",
                "not sure",
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
        mutual_funds_amount: {
            type: Number,
            default: null,
        },
        ETFs_amount: {
            type: Number,
            default: null,
        },

    },
    { timestamps: true }
)

export const Profile  = mongoose.model("Profile", ProfileSchema)
