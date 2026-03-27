// Configure DNS before any imports that might need it
// delete this when merge
import dns from 'dns'
dns.setServers(["1.1.1.1", "1.0.0.1"]);
//

import { config } from "dotenv"
import { connectMongooseDB } from './lib/db.js'
import { createApp } from './app.js'
import { ENVIRONMENT, PORT } from './utils/constants.js'

// Enable dotenv
config()

const app = createApp()

app.listen(PORT, () => {
    console.log(`Server is listening on port:  ${PORT}`)
    console.log(`process.env.NODE_ENV:         ${ENVIRONMENT.nodeEnv}`)

    connectMongooseDB(ENVIRONMENT.mongoURI)
})
