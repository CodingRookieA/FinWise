import fs from 'fs'
import path from 'path'
import readline from 'readline'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import { indexSource } from './services/article/indexService.js'
import { cleanArticle } from './services/article/cleaningService.js'
import { chunkArticle } from './services/article/chunkingService.js'
import { ALLOWED_CATEGORIES, ENVIRONMENT } from './utils/constants.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WATCH_FILE = path.join(__dirname, 'sample-article.txt')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

let isProcessing = false

function isValidUrl(string) {
    try {
        new URL(string)
        return true
    } catch (_) {
        return false
    }
}

async function processArticle() {
    if (isProcessing) return
    isProcessing = true

    try {
        console.log('\n' + '='.repeat(60))
        console.log('📄 Change detected in sample-article.txt')
        console.log('='.repeat(60))

        // Read file content
        const content = fs.readFileSync(WATCH_FILE, 'utf-8').trim()

        if (!content) {
            console.log('\n⚠️  File is empty. Skipping...\n')
            console.log('👀 Watching for changes...\n')
            isProcessing = false
            return
        }

        console.log(`\n📝 Content detected (${content.length} characters)`)

        // Get URL
        console.log('\n' + '━'.repeat(50))
        let url = ''
        while (!url) {
            url = await question('🔗 Article URL: ')
            if (!isValidUrl(url)) {
                console.log('❌ Invalid URL format. Please enter a valid URL.')
                url = ''
            }
        }

        // Get category
        console.log('\n📂 Select category:')
        ALLOWED_CATEGORIES.forEach((cat, index) => {
            console.log(`   ${index + 1}. ${cat}`)
        })

        let category = ''
        while (!category) {
            const input = await question('\n📂 Category (name or number): ')
            
            const num = parseInt(input)
            if (!isNaN(num) && num >= 1 && num <= ALLOWED_CATEGORIES.length) {
                category = ALLOWED_CATEGORIES[num - 1]
            } else if (ALLOWED_CATEGORIES.includes(input)) {
                category = input
            } else {
                console.log(`❌ Invalid category. Choose from: ${ALLOWED_CATEGORIES.join(', ')} or enter a number (1-${ALLOWED_CATEGORIES.length})`)
            }
        }

        console.log('\n' + '━'.repeat(50))
        console.log('Summary:')
        console.log(`  URL: ${url}`)
        console.log(`  Category: ${category}`)
        console.log(`  Content length: ${content.length} characters`)
        console.log('━'.repeat(50))

        // Preview chunking results
        console.log('\n📊 Analyzing content and generating chunks...\n')
        const cleanedText = cleanArticle(content)
        const previewChunks = chunkArticle(cleanedText)
        
        console.log(`✅ Generated ${previewChunks.length} chunks\n`)
        
        // Show preview of each chunk
        previewChunks.forEach((chunk, index) => {
            const tokenEstimate = Math.ceil(chunk.length / 4)
            console.log(`📦 Chunk ${index + 1}/${previewChunks.length} (≈${tokenEstimate} tokens, ${chunk.length} chars)`)
            console.log(chunk)
            console.log('\n' + '='.repeat(80))
        })

        console.log('━'.repeat(50))

        const confirm = await question('\n⚠️  Proceed with indexing? (yes/no): ')
        
        if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
            // Index the article
            console.log('\n🚀 Starting indexing process...\n')
            const chunks = await indexSource({ url, category }, content)

            console.log(`\n✅ Successfully indexed article!`)
            console.log(`   Created ${chunks.length} chunks`)
            console.log(`   URL: ${url}`)
            console.log(`   Category: ${category}\n`)

            // Clear the file for next article
            fs.writeFileSync(WATCH_FILE, '')
            console.log('🗑️  Cleared sample-article.txt for next article\n')
        } else {
            console.log('❌ Cancelled\n')
        }

        console.log('👀 Watching for changes...\n')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
        console.log('\n👀 Watching for changes...\n')
    } finally {
        isProcessing = false
    }
}

// Create sample file if it doesn't exist
if (!fs.existsSync(WATCH_FILE)) {
    fs.writeFileSync(WATCH_FILE, '')
}

async function main() {
    console.log('━'.repeat(60))
    console.log('📰 Article Indexer - Watch Mode')
    console.log('━'.repeat(60))

    // Connect to MongoDB
    try {
        console.log('\n🔌 Connecting to MongoDB...')
        await mongoose.connect(ENVIRONMENT.mongoURI)
        
        // Wait for connection to be fully ready
        await new Promise((resolve) => {
            if (mongoose.connection.readyState === 1) {
                resolve()
            } else {
                mongoose.connection.once('open', resolve)
            }
        })
        
        console.log('✅ MongoDB connected')
        
        // Test the connection with a simple query
        await mongoose.connection.db.admin().ping()
        console.log('✅ Database ping successful')
        
        console.log('\n📝 Paste article content into sample-article.txt and save')
        console.log('👀 Watching for changes...\n')

        // Watch for file changes
        fs.watch(WATCH_FILE, (eventType) => {
            if (eventType === 'change') {
                // Verify connection before processing
                if (mongoose.connection.readyState !== 1) {
                    console.error('\n❌ MongoDB connection lost. Please restart the script.\n')
                    return
                }
                processArticle()
            }
        })
    } catch (error) {
        console.error('\n❌ MongoDB connection error:', error.message)
        console.error('Mongo URI:', ENVIRONMENT.mongoURI ? 'Configured' : 'Missing')
        process.exit(1)
    }
}

main()
