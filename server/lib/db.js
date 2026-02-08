import mongoose from "mongoose"

export const connectMongooseDB = async (url) => {
    try {
        console.log('Connecting to the MongoDB...')
        await mongoose.connect(url);
        console.log('MongoDB connected successfully')
    } catch (error) {
        console.error('MongoDB connection error: ', error)
    }
}
