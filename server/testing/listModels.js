/**
 * listModels.js
 * Lists all available models from Google AI API
 * 
 * Usage: node listModels.js
 */

import { ENVIRONMENT } from '../utils/constants.js'

async function listModels() {
    try {
        console.log('\n🔍 Fetching available models from Google AI API...\n')
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${ENVIRONMENT.aiGeneralApiKey}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`API error: ${JSON.stringify(error)}`)
        }

        const data = await response.json()
        
        console.log('📋 Available Models:\n')
        console.log('='.repeat(80))
        
        if (data.models && data.models.length > 0) {
            data.models.forEach(model => {
                console.log(`\n📦 Name: ${model.name}`)
                console.log(`   Display Name: ${model.displayName || 'N/A'}`)
                console.log(`   Description: ${model.description || 'N/A'}`)
                
                if (model.supportedGenerationMethods) {
                    console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(', ')}`)
                }
                
                if (model.inputTokenLimit) {
                    console.log(`   Input Token Limit: ${model.inputTokenLimit}`)
                }
                
                if (model.outputTokenLimit) {
                    console.log(`   Output Token Limit: ${model.outputTokenLimit}`)
                }
                
                console.log('   ' + '-'.repeat(76))
            })
            
            console.log('\n' + '='.repeat(80))
            console.log(`\n✅ Total models found: ${data.models.length}\n`)
            
            // Filter models that support generateContent
            const contentGenerators = data.models.filter(m => 
                m.supportedGenerationMethods && 
                m.supportedGenerationMethods.includes('generateContent')
            )
            
            console.log('\n📝 Models supporting generateContent:')
            console.log('='.repeat(80))
            contentGenerators.forEach(model => {
                console.log(`   • ${model.name}`)
            })
            console.log('\n')
            
        } else {
            console.log('No models found.')
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message)
        process.exit(1)
    }
}

listModels()
