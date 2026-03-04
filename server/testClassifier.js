/**
 * testClassifier.js
 * Quick test script for the query classifier
 * 
 * Usage: node testClassifier.js
 */

import mongoose from 'mongoose'
import { ENVIRONMENT } from './utils/constants.js'
import { classifyQuery } from './helpers/classifier.js'

const testQueries = [
    "What is a mutual fund?",
    "Show me the top performing Canadian equity funds",
    "How do RRSP contribution limits work?",
    "What are some good balanced funds and how do they work?",
    "Compare the performance of fund ABC123 vs DEF456",
    "What's the weather today?",
    "Should I invest in a TFSA or RRSP?",
    "What is the MER for fund XYZ789?"
]

async function testClassifier() {
    console.log('\n🧪 Testing Query Classifier\n')
    console.log('='.repeat(60))

    for (const query of testQueries) {
        console.log(`\n📝 Query: "${query}"`)
        
        try {
            const result = await classifyQuery(query)
            console.log(`   Articles needed: ${result.needs_articles ? '✅' : '❌'}`)
            console.log(`   Funds needed:    ${result.needs_funds ? '✅' : '❌'}`)
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`)
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Testing complete\n')
}

testClassifier()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Test failed:', error)
        process.exit(1)
    })
