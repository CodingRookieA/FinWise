/**
 * chunkService.js
 * Splits cleaned article text into chunks suitable for embedding.
 *
 * Strategy: paragraph-based chunking with a token budget and overlap for context.
 * Each chunk stays well under the 2048 token limit of text-embedding-004.
 * Target: ~400 tokens (~300 words) per chunk — leaves comfortable headroom.
 */

const MAX_TOKENS = 400   // target max tokens per chunk
const OVERLAP_TOKENS = 50 // overlap between chunks for context continuity
const CHARS_PER_TOKEN = 4 // rough estimate: 1 token ≈ 4 characters

function estimateTokens(text) {
    return Math.ceil(text.length / CHARS_PER_TOKEN)
}

/**
 * Splits article text into chunks based on paragraph breaks.
 * Paragraphs are grouped until the token budget is reached,
 * then a new chunk starts with overlap from the previous chunk.
 *
 * @param {string} text - cleaned article content
 * @returns {string[]} array of chunk strings
 */
export function chunkArticle(text) {
    // First, normalize line breaks and ensure headings have paragraph breaks
    // Add blank lines before lines that end with '?' (likely headings)
    text = text.replace(/([^\n])(\n)([A-Z].*\?)/g, '$1\n\n$3')
    
    // Split on paragraph breaks (one or more blank lines)
    const paragraphs = text
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0)

    if (paragraphs.length === 0) return []

    const chunks = []
    let currentChunk = ''
    let overlapBuffer // Store text for overlap with next chunk

    for (const paragraph of paragraphs) {
        // If a single paragraph exceeds MAX_TOKENS, split it by sentences
        if (estimateTokens(paragraph) > MAX_TOKENS) {
            // Save current chunk if it exists
            if (currentChunk.trim().length > 0) {
                chunks.push(currentChunk.trim())
                // Extract last sentences for overlap
                overlapBuffer = getLastSentences(currentChunk, OVERLAP_TOKENS)
                currentChunk = overlapBuffer
            }
            
            // Split large paragraph by sentences
            const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph]
            
            for (const sentence of sentences) {
                const candidate = currentChunk
                    ? currentChunk + ' ' + sentence.trim()
                    : sentence.trim()
                
                if (estimateTokens(candidate) > MAX_TOKENS && currentChunk.length > 0) {
                    chunks.push(currentChunk.trim())
                    // Add overlap for context
                    overlapBuffer = getLastSentences(currentChunk, OVERLAP_TOKENS)
                    currentChunk = overlapBuffer + ' ' + sentence.trim()
                } else {
                    currentChunk = candidate
                }
            }
            
            continue
        }
        
        // Normal paragraph processing
        const candidate = currentChunk
            ? currentChunk + '\n\n' + paragraph
            : paragraph

        if (estimateTokens(candidate) > MAX_TOKENS && currentChunk.length > 0) {
            // Current chunk is full — save it and start a new one
            chunks.push(currentChunk.trim())
            // Add overlap from previous chunk for context continuity
            overlapBuffer = getLastSentences(currentChunk, OVERLAP_TOKENS)
            currentChunk = overlapBuffer + '\n\n' + paragraph
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

/**
 * Extract the last few sentences from text to use as overlap
 * @param {string} text - source text
 * @param {number} maxTokens - max tokens to extract
 * @returns {string} last sentences within token budget
 */
function getLastSentences(text, maxTokens) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || []
    if (sentences.length === 0) return ''
    
    let overlap = ''
    // Work backwards from last sentence
    for (let i = sentences.length - 1; i >= 0; i--) {
        const candidate = sentences[i].trim() + ' ' + overlap
        if (estimateTokens(candidate) > maxTokens) break
        overlap = candidate.trim()
    }
    
    return overlap
}

