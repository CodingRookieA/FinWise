import mongoose from 'mongoose'

const AccountSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        profilePic: {
            type: String,
            default: null,
        }
    },
    { timestamps: true }
)

export const Account = mongoose.model('FinWise-accounts', AccountSchema)
