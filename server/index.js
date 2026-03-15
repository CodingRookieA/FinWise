// Configure DNS before any imports that might need it
// delete this when merge
import dns from 'dns'
dns.setServers(["1.1.1.1", "1.0.0.1"]);
//

import express from 'express'
import cors from 'cors'
import { config } from "dotenv"
import { connectMongooseDB } from './lib/db.js'
import session from 'express-session'

// --- Strategy Pattern: Routing Context ---
// This file acts as the "Context" in the Strategy Pattern for routing.
// Each imported router is a concrete routing strategy responsible for
// handling a distinct domain of HTTP requests (accounts, assets, profile,
// chat, email). The context selects the appropriate strategy at runtime
// based on the incoming request path, delegating all processing to that
// strategy without needing to know its internal implementation details.
import accountRouter from './routes/account.js'
import assetRouter from './routes/assetRoutes.js'
import profileRouter from "./routes/profile.js";
import chatRouter from './routes/chat.js'
import emailRouter from './routes/email.js'
import { CLIENTURL, ENVIRONMENT, PORT } from './utils/constants.js'

// Enable dotenv
config()

// Variables
const app = express()

//Middleware
const corsConfig = {
    origin: CLIENTURL,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
}
app.use(cors(corsConfig))

app.use(
    session({
        secret: ENVIRONMENT.sessionSecretKey,
        saveUninitialized: false,
        resave: false,
    })
);

app.use(express.json())

// Strategy Pattern: each app.use() call registers a concrete routing strategy
// under a specific path prefix. Express acts as the dispatcher, selecting
// the matching strategy and forwarding the request to it.
// Routes
import yahooFinance from './helpers/yahooFinance.js';

app.get('/api/health', (req, res) => {
    // yahooFinance.isValidCanadianETF('APLE')
    yahooFinance.getCanadianETFS()
    res.status(200).json({ status: 'OK '})
})

app.use('/api/users', accountRouter)
app.use("/api/profile", profileRouter);
app.use('/api/chat', chatRouter)
app.use('/api/assets', assetRouter)
app.use('/api/email', emailRouter)


app.listen(PORT, () => {
    console.log(`Server is listening on port:  ${PORT}`)
    console.log(`process.env.NODE_ENV:         ${ENVIRONMENT.nodeEnv}`)

    connectMongooseDB(ENVIRONMENT.mongoURI)
})
