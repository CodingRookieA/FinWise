import mongoose from 'mongoose'

const ProfileSchema = new mongoose.Schema(
    {
        // userId:{
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'FinWise-accounts',
        //     required: true
        // }

        userId:{
            type: String,
            required: true,
            unique: true,
            index: true,
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
            enum: ["employed", "self_employed", "student", "unemployed", "retired", "prefer_not_say"],
            default: null,
            trim: true,
        },
        risk_tolerance: {
            type: String,
            enum: ["low", "medium", "high"],
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
                "emergency_fund", 
                "pay_off_debt", 
                "home_down_payment", 
                "big_purchase",
                "grow_wealth", 
                "retirement",
                "education"
            ],
            default: null,
            trim: true,
        },
        housing_status: {
            type: String,
            enum: [
                "rent",
                "own_with_mortgage",
                "own_no_mortgage",
                "live_with_family",
                "student_housing",
                "other",
                "prefer_not_say",
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
