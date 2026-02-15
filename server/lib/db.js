import mongoose from "mongoose"

export const connectMongooseDB = async (url) => {
    try {
        console.log('Connecting to the MongoDB...')
        await mongoose.connect(url, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority'
        });
        console.log('MongoDB connected successfully')
    } catch (error) {
        console.error('MongoDB connection error: ', error)
        console.log('Retrying connection in 5 seconds...')
        setTimeout(() => connectMongooseDB(url), 5000)
    }
}
