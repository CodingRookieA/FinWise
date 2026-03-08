import mongoose from 'mongoose'

const DistributionYearSchema = new mongoose.Schema(
    {
        foreignTax: { type: Number, default: null },
        total: { type: Number, default: null },
        interest: { type: Number, default: null },
        returnCapital: { type: Number, default: null },
        dividends: { type: Number, default: null },
        capitalGains: { type: Number, default: null },
        foreignDividends: { type: Number, default: null },
    },
    { _id: false }
)

const MutualFundSchema = new mongoose.Schema(
    {
        fund_code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        nav: {
            type: Number,
            required: true,
        },
        mer: {
            type: Number,
            required: true,
        },
        '1yr': { type: Number, default: null },
        '3yr': { type: Number, default: null },
        '5yr': { type: Number, default: null },
        distribution: {
            type: Map,
            of: DistributionYearSchema,
            default: {},
        },
        risk: {
            type: String,
            required: true,
            trim: true,
        },
        fund_type: {
            type: String,
            required: true,
            enum: ['Fixed Income', 'Equity', 'Balanced', 'Money Market', 'Specialty'],
        },
        account_eligibility: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        minimum_investment: {
            type: Number,
            default: null,
        },
    },
    { timestamps: true }
)

// Use explicit collection name 'mutual-funds' so the model maps to the
// existing collection in the database (avoids Mongoose name transformations).
export const MutualFund = mongoose.model('MutualFund', MutualFundSchema, 'mutual-funds')
