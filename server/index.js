import express from 'express'
import cors from 'cors'
import { config } from "dotenv"
import { connectMongooseDB } from './lib/db.js'

import accountRouter from './routes/account.js'

// Enable dotenv
config()

// Variables
const app = express()
const port = process.env.PORT || 9000
const nodeEnv = process.env.NODE_ENV
const clientURL = 
    nodeEnv === 'production'
    ? process.env.CLIENT_URL
    : process.env.CLIENT_URL_DEVELOPMENT
const MongoURI = process.env.MONGODB_URI

//Middleware
const corsConfig = {
    origin: clientURL,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
}
app.use(cors(corsConfig))

app.use(express.json())

//Routes
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK '})
})

app.use('/api/users', accountRouter)

app.listen(port, () => {
    console.log(`Server is listening on port:  ${port}`)
    console.log(`process.env.NODE_ENV:         ${nodeEnv}`)

    connectMongooseDB(MongoURI)
})
