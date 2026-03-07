/**
 * testVectorSearch.js
 * Tests the MongoDB vector search index (chunk_embedding_index)
 * 
 * Usage: npm run test-vector
 */

import mongoose from 'mongoose'
import readline from 'readline'
import { ENVIRONMENT } from './utils/constants.js'
import { embedText } from './services/article/embeddingService.js'
import { Chunk } from './models/Chunks.js'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

// Sample queries for testing
const SAMPLE_QUERIES = [
    "What is a mutual fund?",
    "How do TFSA accounts work?",
    "What are management fees?",
    "Asset allocation strategies",
    "Capital gains tax rules"
]

async function performVectorSearch(queryText, limit = 5) {
    console.log(`\n🔍 Searching for: "${queryText}"  (threshold: ${ENVIRONMENT.similarityThreshold})`)
    console.log('━'.repeat(60))
    
    // Step 1: Generate embedding for the query
    console.log('📊 Generating query embedding...')
    const queryEmbedding = await embedText(queryText)
    console.log(`✅ Embedding generated (${queryEmbedding.length} dimensions)`)
    
    // Step 2: Perform vector search using MongoDB Atlas Vector Search
    console.log('\n🔎 Performing vector search...')
    
    const threshold = ENVIRONMENT.similarityThreshold
    
    const results = await Chunk.aggregate([
        {
            $vectorSearch: {
                index: "chunk_embedding_index",
                path: "embedding",
                queryVector: queryEmbedding,
                numCandidates: 100,  // Number of candidates to consider
                limit: limit          // Number of results to return
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
    const filtered = results.filter(r => r.score >= threshold)
    if (results.length > filtered.length) {
        console.log(`\n🔻 Filtered out ${results.length - filtered.length}/${results.length} results below threshold (${threshold})`)
    }
    
    return filtered
}

function displayResults(results) {
    if (results.length === 0) {
        console.log('\n⚠️  No results found. Make sure you have indexed some articles first.')
        return
    }
    
    console.log(`\n✅ Found ${results.length} results:\n`)
    
    results.forEach((result, index) => {
        console.log(`${'='.repeat(80)}`)
        console.log(`📄 Result ${index + 1} (Score: ${result.score.toFixed(4)})`)
        console.log(`━`.repeat(80))
        console.log(`🔗 Source: ${result.source_url}`)
        console.log(`📂 Category: ${result.source_category}`)
        console.log(`📦 Chunk: ${result.chunk_index}`)
        console.log(`\n📝 Content:`)
        console.log(result.content)
        console.log()
    })
    console.log(`${'='.repeat(80)}\n`)
}

async function runSampleQueries() {
    console.log('\n🧪 Running sample queries...\n')
    
    for (const query of SAMPLE_QUERIES) {
        try {
            const results = await performVectorSearch(query, 3)
            displayResults(results)
            
            // Brief pause between queries
            await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
            console.error(`\n❌ Error with query "${query}":`, error.message)
        }
    }
}

async function interactiveMode() {
    console.log('\n━'.repeat(60))
    console.log('🎯 Interactive Vector Search Mode')
    console.log('━'.repeat(60))
    console.log('Enter your queries below (type "exit" to quit)\n')
    
    while (true) {
        const query = await question('🔍 Your query: ')
        
        if (!query.trim()) {
            continue
        }
        
        if (query.toLowerCase() === 'exit') {
            console.log('\n👋 Goodbye!\n')
            break
        }
        
        try {
            const numResults = await question('📊 Number of results (default 5): ')
            const limit = parseInt(numResults) || 5
            
            const results = await performVectorSearch(query, limit)
            displayResults(results)
        } catch (error) {
            console.error('\n❌ Error:', error.message, '\n')
        }
    }
}

async function testIndexExists() {
    console.log('\n🔍 Checking if vector search index exists...')
    
    try {
        // Try a simple vector search to see if index exists
        const testEmbedding = new Array(3072).fill(0)
        testEmbedding[0] = 1  // Just a dummy vector
        
        await Chunk.aggregate([
            {
                $vectorSearch: {
                    index: "chunk_embedding_index",
                    path: "embedding",
                    queryVector: testEmbedding,
                    numCandidates: 1,
                    limit: 1
                }
            },
            { $limit: 1 }
        ])
        
        console.log('✅ Vector search index "chunk_embedding_index" is working!')
        return true
    } catch (error) {
        if (error.message.includes('index') || error.message.includes('not found')) {
            console.error('❌ Vector search index "chunk_embedding_index" not found or not ready.')
            console.error('   Make sure you created the index in MongoDB Atlas.')
            return false
        }
        throw error
    }
}

async function main() {
    console.log('━'.repeat(60))
    console.log('🧪 Vector Search Test Utility')
    console.log('━'.repeat(60))
    
    try {
        // Connect to MongoDB
        console.log('\n🔌 Connecting to MongoDB...')
        await mongoose.connect(ENVIRONMENT.mongoURI)
        
        // Wait for connection
        await new Promise((resolve) => {
            if (mongoose.connection.readyState === 1) {
                resolve()
            } else {
                mongoose.connection.once('open', resolve)
            }
        })
        
        console.log('✅ MongoDB connected')
        
        // Check if index exists
        const indexExists = await testIndexExists()
        if (!indexExists) {
            console.log('\n💡 To create the index, go to MongoDB Atlas:')
            console.log('   1. Navigate to your cluster → Database → Browse Collections')
            console.log('   2. Select your database → chunks collection')
            console.log('   3. Go to "Search Indexes" tab')
            console.log('   4. Create a new Vector Search index named "chunk_embedding_index"')
            console.log('   5. Set the field path to "embedding" with 3072 dimensions')
            process.exit(1)
        }
        
        // Check how many chunks are available
        const chunkCount = await Chunk.countDocuments()
        console.log(`📊 Database has ${chunkCount} chunks indexed\n`)
        
        if (chunkCount === 0) {
            console.log('⚠️  No chunks found. Please index some articles first using:')
            console.log('   npm run watch  (watch mode)')
            console.log('   npm run ar     (interactive mode)')
            process.exit(0)
        }
        
        // Ask what to do
        console.log('━'.repeat(60))
        console.log('Options:')
        console.log('  1. Run sample queries')
        console.log('  2. Interactive mode (enter your own queries)')
        console.log('━'.repeat(60))
        
        const choice = await question('\nChoose option (1 or 2): ')
        
        if (choice === '1') {
            await runSampleQueries()
        } else if (choice === '2') {
            await interactiveMode()
        } else {
            console.log('\n❌ Invalid choice. Run the script again.')
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message)
        console.error(error.stack)
        process.exit(1)
    } finally {
        rl.close()
        await mongoose.connection.close()
        console.log('👋 Disconnected from MongoDB')
    }
}

main()
