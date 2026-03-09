/**
 * testClassifier.js
 * Quick test script for the query classifier
 * 
 * Usage: 
 *   node testClassifier.js    # Runs default tests, then enters interactive mode
 */

import mongoose from 'mongoose'
import * as readline from 'readline'
import { ENVIRONMENT } from '../utils/constants.js'
import { classifyQuery } from '../helpers/classifier.js'

const defaultTestQueries = [
    "What is a mutual fund?",
    "Show me the top performing Canadian equity funds",
    "How do RRSP contribution limits work?",
    "What are some good balanced funds and how do they work?",
    "Compare the performance of fund ABC123 vs DEF456",
    "What's the weather today?",
    "Should I invest in a TFSA or RRSP?",
    "What is the MER for fund XYZ789?",
    "What distributions did fund RBF565 pay in 2024?",
    "Show me the capital gains and dividend history for this fund",
    "Compare top performing ETFs in Canada"
]

// Create readline interface for interactive mode
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function question(query) {
    return new Promise(resolve => rl.question(query, resolve))
}

async function testClassifier() {
    console.log('\n🧪 Testing Query Classifier\n')
    console.log('📌 Running default test queries...')
    console.log('='.repeat(60))

    // Run default test queries
    for (const query of defaultTestQueries) {
        console.log(`\n📝 Query: "${query}"`)
        
        try {
            const result = await classifyQuery(query)
            console.log(`   Articles needed:      ${result.needs_articles ? '✅' : '❌'}`)
            console.log(`   Funds needed:         ${result.needs_funds ? '✅' : '❌'}`)
            console.log(`   ETF needed:           ${result.needs_ETF ? '✅' : '❌'}`)
            console.log(`   Distribution needed:  ${result.needs_distribution_mutual_funds ? '✅' : '❌'}`)
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`)
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Default tests complete\n')
    
    // Enter interactive mode
    console.log('💬 Entering interactive mode...')
    console.log('   Type your query to test the classifier')
    console.log('   Type "exit" or "quit" to stop\n')
    
    while (true) {
        const userQuery = await question('🔍 Enter query: ')
        
        if (!userQuery.trim()) {
            continue
        }
        
        if (userQuery.toLowerCase() === 'exit' || userQuery.toLowerCase() === 'quit') {
            console.log('\n👋 Exiting interactive mode...\n')
            break
        }
        
        try {
            const result = await classifyQuery(userQuery)
            console.log(`   Articles needed:      ${result.needs_articles ? '✅' : '❌'}`)
            console.log(`   Funds needed:         ${result.needs_funds ? '✅' : '❌'}`)
            console.log(`   ETF needed:           ${result.needs_ETF ? '✅' : '❌'}`)
            console.log(`   Distribution needed:  ${result.needs_distribution_mutual_funds ? '✅' : '❌'}\n`)
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}\n`)
        }
    }
    
    rl.close()
}

testClassifier()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Test failed:', error)
        rl.close()
        process.exit(1)
    })
