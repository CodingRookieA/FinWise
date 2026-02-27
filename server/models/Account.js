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
        password: {
            type: String,
            required: function () {
                return this.authType === 'local'
            }
        },
        picture: {
            type: String,
            default: null,
        },
        authType: {
            type: String,
            enum: ['local', 'google'],
            default: 'local',
            required: true
        },
        isVerified: {
            type: Boolean,
            default: false,
            required: true
        },
    },
    { timestamps: true }
)

export const Account = mongoose.model('FinWise-accounts', AccountSchema)
