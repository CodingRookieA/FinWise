import { get } from "mongoose";

const SYSTEM_PROMPT = 
`You are a financial guidance assistant

Follow these rules:
1. Answer clearly and directly.
2. Do not make up information.
3. If the question is ambiguous, ask for clarification.
4. Keep responses under 150 words unless asked otherwise.

At the end of your response, include:
[DEBUG: system_prompt_active]`;

export default {
    //Function for generating prompts based on user input and context
    generatePrompt(userInput, userId = null) {
        // Return messages array for API calls
        return [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userInput }
        ]
    },

    //Function for fetching stock information (placeholder)
    getStockInfo() {
        return ``
    },

    //Function for fetching investment documentation (placeholder)
    getInvestmentDocs() {
        return ``
    }
}