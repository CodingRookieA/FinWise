/**
 * chunkService.js
 * Splits cleaned article text into chunks suitable for embedding.
 *
 * Strategy: paragraph-based chunking with a token budget.
 * Each chunk stays well under the 2048 token limit of text-embedding-004.
 * Target: ~400 tokens (~300 words) per chunk — leaves comfortable headroom.
 */

const MAX_TOKENS = 1000   // target max tokens per chunk
const CHARS_PER_TOKEN = 4 // rough estimate: 1 token ≈ 4 characters

function estimateTokens(text) {
    return Math.ceil(text.length / CHARS_PER_TOKEN)
}

/**
 * Splits article text into chunks based on paragraph breaks.
 * Paragraphs are grouped until the token budget is reached,
 * then a new chunk starts.
 *
 * @param {string} text - cleaned article content
 * @returns {string[]} array of chunk strings
 */
export function chunkArticle(text) {
    // Split on paragraph breaks (one or more blank lines)
    const paragraphs = text
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0)

    if (paragraphs.length === 0) return []

    const chunks = []
    let currentChunk = ''

    for (const paragraph of paragraphs) {
        const candidate = currentChunk
            ? currentChunk + '\n\n' + paragraph
            : paragraph

        if (estimateTokens(candidate) > MAX_TOKENS && currentChunk.length > 0) {
            // Current chunk is full — save it and start a new one
            chunks.push(currentChunk.trim())
            currentChunk = paragraph
        } else {
            // Still within budget — keep adding to current chunk
            currentChunk = candidate
        }
    }

    // Don't forget the last chunk
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim())
    }

    return chunks
}