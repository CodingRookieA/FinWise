/**
 * embeddingService.js
 * Calls Gemini text-embedding-004 to generate a 3072-dimension
 * vector for a given piece of text.
 */


import { ENVIRONMENT } from "../../utils/constants.js"

/**
 * Generates an embedding vector for the given text.
 * Prepends the article title to each chunk so the embedding
 * captures what article this chunk belongs to.
 *
 * @param {string} text - text to embed
 * @returns {number[]} 3072-dimension vector
 */
export async function embedText(text) {
  const response = await fetch(
    `${ENVIRONMENT.aiEmbeddingUrl}?key=${ENVIRONMENT.aiEmbeddingApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text }] }
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Embedding API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  return data.embedding.values  // number[] of length 3072
}