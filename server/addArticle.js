/**
 * addArticle.js
 * Simple CLI interface for adding new articles to the knowledge base
 * 
 * Usage: node addArticle.js
 */

import mongoose from 'mongoose'
import * as readline from 'readline'
import { readFile } from 'fs/promises'
import { ENVIRONMENT, ALLOWED_CATEGORIES } from './utils/constants.js'
import { indexSource } from './services/article/indexService.js'
import { cleanArticle } from './services/article/cleaningService.js'
import { chunkArticle } from './services/article/chunkingService.js'

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

// Promisify question
function question(query) {
    return new Promise(resolve => rl.question(query, resolve))
}

// Validate URL format
function isValidUrl(string) {
    try {
        const url = new URL(string)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch (_) {
        return false
    }
}

// Validate category
function isValidCategory(category) {
    return ALLOWED_CATEGORIES.includes(category)
}

async function main() {
    try {
        console.log('\n📚 Add New Article to Knowledge Base\n')
        console.log('━'.repeat(50))

        // Connect to MongoDB
        await mongoose.connect(ENVIRONMENT.mongoURI)
        console.log('✅ MongoDB connected\n')

        // Collect URL
        const url = await question('📎 Enter article URL: ')
        if (!url.trim()) {
            throw new Error('URL is required')
        }
        if (!isValidUrl(url.trim())) {
            throw new Error('Invalid URL format. Must be a valid http:// or https:// URL')
        }

        // Collect category
        console.log('\n📂 Available categories:')
        ALLOWED_CATEGORIES.forEach((cat, idx) => console.log(`   ${idx + 1}. ${cat}`))
        const categoryInput = await question('\nEnter category number or name (default: 1/fundamentals): ')
        
        let category
        if (!categoryInput.trim()) {
            category = 'fundamentals'
        } else {
            const trimmed = categoryInput.trim()
            // Check if input is a number
            const num = parseInt(trimmed)
            if (!isNaN(num) && num >= 1 && num <= ALLOWED_CATEGORIES.length) {
                category = ALLOWED_CATEGORIES[num - 1]
            } else {
                category = trimmed
            }
        }
        
        if (!isValidCategory(category)) {
            throw new Error(`Invalid category "${categoryInput.trim()}". Enter a number 1-${ALLOWED_CATEGORIES.length} or one of: ${ALLOWED_CATEGORIES.join(', ')}`)
        }

        // Collect content
        console.log('\n📝 Content options:')
        console.log('   • Paste directly (then press Enter twice to finish)')
        console.log('   • Or provide a file path (.txt or .md)')
        
        const contentInput = await question('\nEnter content or file path: ')
        let content

        // Check if it's a file path
        if (contentInput.trim().match(/\.(txt|md)$/i)) {
            try {
                content = await readFile(contentInput.trim(), 'utf-8')
                console.log(`✅ Read ${content.length} characters from file`)
            } catch (err) {
                throw new Error(`Cannot read file: ${err.message}`)
            }
        } else {
            // Treat as direct content
            content = contentInput
            
            // If short, allow multi-line input
            if (content.length < 100) {
                console.log('(Continue entering content, press Enter on empty line to finish):')
                let line
                const lines = [content]
                while ((line = await question('')) !== '') {
                    lines.push(line)
                }
                content = lines.join('\n')
            }
        }

        if (!content.trim()) {
            throw new Error('Content is required')
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
        if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
            console.log('❌ Cancelled')
            process.exit(0)
        }

        // Index the article
        console.log('\n🚀 Starting indexing process...\n')
        const chunks = await indexSource({ url, category }, content)

        console.log(`\n✅ Successfully indexed article!`)
        console.log(`   Created ${chunks.length} chunks`)
        console.log(`   URL: ${url}`)
        console.log(`   Category: ${category}\n`)

    } catch (error) {
        console.error('\n❌ Error:', error.message)
        process.exit(1)
    } finally {
        rl.close()
        await mongoose.connection.close()
        console.log('👋 Disconnected from MongoDB')
    }
}

main()
