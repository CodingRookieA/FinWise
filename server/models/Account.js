import mongoose from 'mongoose'

const AccountSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            unique: true,
            required: true,
        },
        name: {
            type: String,
            required: true
        },
        picture: {
            type: String,
            default: null,
        }
    },
    { timestamps: true }
)

export const Account = mongoose.model('FinWise-accounts', AccountSchema)
