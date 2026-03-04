/**
 * indexService.js
 * Orchestrates the full pipeline:
 * create source → clean → chunk → embed → save to MongoDB
 *
 * Called when a new article URL is submitted.
 */

import { cleanArticle } from './cleaningService.js'
import { chunkArticle } from './chunkingService.js'
import { embedText } from './embeddingService.js'
import { Chunk } from '../../models/Chunks.js'
import { Source } from '../../models/Source.js'


/**
 * Indexes a source article:
 * 1. Upserts a Source document from the given URL (creates if new, reuses if seen before)
 * 2. Cleans the raw text
 * 3. Chunks it into ~400 token pieces
 * 4. Embeds each chunk via Gemini
 * 5. Saves chunks to MongoDB
 * 6. Marks the Source as indexed
 *
 * @param {{ url: string, category: string }} sourceData - URL and category for the source
 * @param {string} content - raw article text fetched from that URL
 * @returns {object[]} saved Chunk documents
 */
export async function indexSource( {url, category="fundamentals"}, content) {
    console.log(`\n📄 Indexing: "${url}"`)

    // Step 0 — reject if this URL has already been indexed
    const existing = await Source.findOne({ url })
    if (existing) {
        throw new Error(`Source already indexed: "${url}". Use reIndexSource to update it.`)
    }

    const source = await Source.create({ url, category })
    console.log(`   ✅ Source created (id: ${source._id})`)

    return runIndexPipeline(source, content)
}


/**
 * Internal pipeline: cleans, chunks, embeds, and saves
 * chunks for an already-persisted source document.
 *
 * @param {object} source   - saved Source mongoose document
 * @param {string} content  - raw article text
 * @returns {object[]} saved Chunk documents
 */
async function runIndexPipeline(source, content) {
    // Step 1 — clean
    const cleanedText = cleanArticle(content)
    console.log(`   ✅ Cleaned — ${cleanedText.length} chars`)

    // Step 2 — chunk
    const chunks = chunkArticle(cleanedText)
    console.log(`   ✅ Chunked — ${chunks.length} chunks`)

    if (chunks.length === 0) {
        throw new Error('No chunks generated — article content may be too short or empty after cleaning')
    }

    // Step 3 — delete existing chunks for this source (safe to re-index)
    await Chunk.deleteMany({ source_id: source._id })

    // Step 4 — embed each chunk and save
    // Sequential (not parallel) to avoid hitting Gemini rate limits
    const savedChunks = []

    for (let i = 0; i < chunks.length; i++) {
        const chunkContent = chunks[i]

        // Prepend URL so embedding captures article context
        const textToEmbed = `${source.url}\n\n${chunkContent}`
        const embedding = await embedText(textToEmbed)

        const chunk = await Chunk.create({
            source_id: source._id,
            source_url: source.url,
            source_category: source.category,
            content: chunkContent,
            chunk_index: i,
            embedding,
        })

        savedChunks.push(chunk)
        console.log(`   ✅ Chunk ${i + 1}/${chunks.length} embedded and saved`)
    }

    // Step 5 — mark source as indexed
    await Source.updateOne(
        { _id: source._id },
        { is_indexed: true, last_indexed_at: new Date() }
    )

    console.log(`   🎉 Done — "${source.url}" indexed with ${savedChunks.length} chunks\n`)
    return savedChunks
}


/**
 * Re-indexes an existing source with new content.
 * Looks up the source by ID — old chunks are deleted first.
 *
 * @param {string} sourceId - the Source _id
 * @param {string} content  - new raw article text
 * @returns {object[]} saved Chunk documents
 */
export async function reIndexSource(sourceId, content) {
    const source = await Source.findById(sourceId)
    if (!source) throw new Error(`Source not found: ${sourceId}`)
    console.log(`\n🔄 Re-indexing: "${source.url}"`)
    return runIndexPipeline(source, content)
}