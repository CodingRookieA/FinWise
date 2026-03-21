import mongoose from 'mongoose'

const AssetSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'FinWise-accounts'
        },
        symbol: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { timestamps: true }
)

export const Asset = mongoose.model('FinWise-assets', AssetSchema)