import { embedText } from '../services/article/embeddingService.js'
import { Chunk } from '../models/Chunks.js'
import { ENVIRONMENT } from '../utils/constants.js'

const SYSTEM_PROMPT = 
`You are a financial guidance assistant specialized in mutual fund investing.

CRITICAL RULES:
1. **SOURCE OF TRUTH**: You will be provided with context from articles and/or fund data below. When context is provided, you MUST answer ONLY based on that context. DO NOT use your pre-trained knowledge.

2. **If context is provided**: Base your entire answer on the provided information. If the context doesn't contain enough information to fully answer the question, say "Based on the available information, [answer what you can], but I don't have additional details on [what's missing]."

3. **If NO context is provided**: You may use your general knowledge, but clearly state "Based on general knowledge" at the start of your response.

4. **Never make up information**: If you're unsure or the information isn't in the provided context, admit it clearly.

5. **Be concise**: Keep responses under 150 words unless asked otherwise.

6. **Clarity**: If a question is ambiguous, ask for clarification before answering.

At the end of your response, include:
[DEBUG: system_prompt_active]`;

export default {
    //Function for generating prompts based on user input and context
    async generatePrompt(userInput, userId = null, classification = { needs_articles: false, needs_funds: false }) {
        let contextSections = []

        if(classification.needs_articles) {
            const articles = await this.getInvestmentDocs(userInput)
            if (articles) {
                contextSections.push('\n--- ARTICLE CONTEXT (Source of Truth) ---\n' + articles)
            }
        }
        
       
        // If the query needs fund data, we can add a prompt to fetch relevant fund information from the database
        if(classification.needs_funds) {
            // Include fund data context in system prompt
            const funds = this.getStockInfo()
            if (funds) {
                contextSections.push('\n--- FUND DATA (Source of Truth) ---\n' + funds)
            }
        }

        const fullSystemPrompt = contextSections.length > 0
            ? SYSTEM_PROMPT + '\n' + contextSections.join('\n') + '\n--- END OF CONTEXT ---\n'
            : SYSTEM_PROMPT + '\n\n(No specific context provided for this query.)\n'

        console.log('Generated system prompt:\n', fullSystemPrompt)

        // Return messages array for API calls
        return [
            { role: "system", content: fullSystemPrompt },
            { role: "user", content: userInput }
        ]
    },

    //Function for fetching stock information (placeholder)
    getStockInfo() {
        return ``
    },

    //Function for fetching investment documentation via vector search
    async getInvestmentDocs(userInput) {
        try {
            // Generate embedding for the user query
            const queryEmbedding = await embedText(userInput)
            const threshold = ENVIRONMENT.similarityThreshold

            // Perform vector search - retrieve top 5 chunks
            const results = await Chunk.aggregate([
                {
                    $vectorSearch: {
                        index: "chunk_embedding_index",
                        path: "embedding",
                        queryVector: queryEmbedding,
                        numCandidates: 100,
                        limit: 5
                    }
                },
                {
                    $project: {
                        content: 1,
                        source_url: 1,
                        source_category: 1,
                        chunk_index: 1,
                        score: { $meta: "vectorSearchScore" }
                    }
                }
            ])

            // Filter by similarity threshold
            const relevant = results.filter(r => r.score >= threshold)

            if (relevant.length === 0) {
                return ''
            }

            // Format chunks into context string
            return relevant.map((chunk, i) => 
                `[Source ${i + 1}: ${chunk.source_url} | Category: ${chunk.source_category} | Score: ${chunk.score.toFixed(4)}]\n${chunk.content}`
            ).join('\n\n')
        } catch (error) {
            console.error('Error fetching article context:', error.message)
            return ''
        }
    }
}