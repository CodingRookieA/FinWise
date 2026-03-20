/**
 * testFundRetrieval.js
 * Tests mutual fund retrieval and filtering logic against a real user profile.
 * Runs three stages:
 *   1. Raw DB query — shows all funds that match the filter (for debugging)
 *   2. getSFundInfo() — calls the actual prompt-engineering helper with the userId
 *   3. Full generatePrompt() — shows the complete context string the AI would receive
 *
 * Usage (from server/ directory):
 *   node --env-file=.env testing/testFundRetrieval.js
 */

import mongoose from 'mongoose'
import { ENVIRONMENT } from '../utils/constants.js'
import { MutualFund } from '../models/MutualFund.js'
import { Profile } from '../models/profile.js'
import promptengineering from '../helpers/promptengineering.js'

// ── Hardcoded test profile ────────────────────────────────────────────────────
const TEST_USER_ID = '69aa38a46c03e903354e81d8'

// ── Helpers ───────────────────────────────────────────────────────────────────
function section(title) {
    console.log('\n' + '='.repeat(60))
    console.log(`  ${title}`)
    console.log('='.repeat(60))
}

// ── Stage 0: DB diagnostic ────────────────────────────────────────────────────
async function diagnoseFundCollection() {
    section('STAGE 0 — DB Diagnostic (raw collection contents)')

    const total = await MutualFund.countDocuments()
    console.log(`\n  Total documents in MutualFund collection: ${total}`)

    if (total === 0) {
        console.log('  ❌ Collection is empty — seed data is required.')
        return
    }

    // Distinct risk values actually stored
    const distinctRisks = await MutualFund.distinct('risk')
    console.log(`\n  Distinct 'risk' values in DB : ${JSON.stringify(distinctRisks)}`)
    console.log(`  Expected by filter           : ["low", "medium", "high"]`)

    // Sample of 5 funds — show risk and minimum_investment with types
    const sample = await MutualFund.find({}, {
        fund_code: 1, name: 1, risk: 1, minimum_investment: 1, _id: 0
    }).limit(5).lean()

    console.log('\n  Sample funds (up to 5):')
    sample.forEach((f, i) => {
        const minInv = f.minimum_investment
        console.log(`     ${i + 1}. [${f.fund_code}] risk="${f.risk}" (${typeof f.risk}) | min_investment=${JSON.stringify(minInv)} (${typeof minInv})`)
    })

    // Test each filter condition independently to isolate the failure
    console.log('\n  ── Isolating filter conditions ──')

    const riskOnly = await MutualFund.countDocuments({ risk: { $in: ['low', 'medium'] } })
    console.log(`  Funds with risk in [low, medium]                 : ${riskOnly}`)

    const minInvNumeric = await MutualFund.countDocuments({
        $expr: { $lte: [{ $convert: { input: '$minimum_investment', to: 'double', onError: null, onNull: null } }, 4000] }
    })
    console.log(`  Funds where minimum_investment (converted) ≤ 4000: ${minInvNumeric}`)

    const minInvNull = await MutualFund.countDocuments({
        $or: [{ minimum_investment: null }, { minimum_investment: { $exists: false } }]
    })
    console.log(`  Funds where minimum_investment is null/missing   : ${minInvNull}`)

    const bothConditions = await MutualFund.countDocuments({
        risk: { $in: ['low', 'medium'] },
        $or: [
            { $expr: { $lte: [{ $convert: { input: '$minimum_investment', to: 'double', onError: null, onNull: null } }, 4000] } },
            { minimum_investment: null },
            { minimum_investment: { $exists: false } }
        ]
    })
    console.log(`  Funds matching BOTH conditions (expected result)  : ${bothConditions}`)
}

// ── Stage 1: raw DB query ─────────────────────────────────────────────────────
async function testRawQuery(profile) {
    section('STAGE 1 — Raw MongoDB query (what the filter returns)')

    const RISK_LEVELS = { low: 1, medium: 2, high: 3 }
    const userRiskLevel = RISK_LEVELS[profile.risk_tolerance] || 0
    const allowedRisks = Object.entries(RISK_LEVELS)
        .filter(([, level]) => level <= userRiskLevel)
        .map(([name]) => name)

    console.log(`\n  User risk tolerance : ${profile.risk_tolerance}`)
    console.log(`  Allowed risk levels : ${allowedRisks.join(', ')}`)
    console.log(`  Savings balance     : $${profile.savings_balance}`)

    const filter = {
        risk: { $in: allowedRisks },
        $or: [
            {
                $expr: {
                    $lte: [
                        { $convert: { input: '$minimum_investment', to: 'double', onError: null, onNull: null } },
                        profile.savings_balance
                    ]
                }
            },
            { minimum_investment: null },
            { minimum_investment: { $exists: false } }
        ]
    }

    console.log('\n  Filter applied:')
    console.log(JSON.stringify(filter, null, 4))

    const funds = await MutualFund.find(filter, {
        fund_code: 1, name: 1, risk: 1, minimum_investment: 1, _id: 0
    }).lean()

    if (funds.length === 0) {
        console.log('\n  ❌ NO FUNDS MATCHED — the filter returned 0 results.')
        console.log('     Check that minimum_investment values in the DB and risk field enums are correct.')
    } else {
        console.log(`\n  ✅ ${funds.length} fund(s) matched:`)
        funds.forEach((f, i) =>
            console.log(`     ${i + 1}. [${f.fund_code}] ${f.name} | risk: ${f.risk} | min_investment: ${f.minimum_investment} (${typeof f.minimum_investment})`)
        )
    }

    return funds.length
}

// ── Stage 2: getSFundInfo() ───────────────────────────────────────────────────
async function testGetSFundInfo() {
    section('STAGE 2 — getSFundInfo() output (what gets injected into the prompt)')

    console.log(`\n  Calling getSFundInfo with userId: ${TEST_USER_ID}`)

    const result = await promptengineering.getSFundInfo(TEST_USER_ID, false)

    if (!result || result.trim() === '') {
        console.log('\n  ❌ getSFundInfo returned empty string — no funds injected.')
    } else if (result.startsWith('[')) {
        console.log(`\n  ⚠️  getSFundInfo returned a control message:\n\n  ${result}`)
    } else {
        console.log('\n  ✅ getSFundInfo returned fund context:')
        console.log('\n' + result)
    }

    return result
}

// ── Stage 3: full generatePrompt() ───────────────────────────────────────────
async function testGeneratePrompt() {
    section('STAGE 3 — Full generatePrompt() (complete system prompt the AI receives)')

    const testQuery = 'What mutual funds would you recommend for me?'
    console.log(`\n  Test query: "${testQuery}"`)

    const messages = await promptengineering.generatePrompt(
        testQuery,
        TEST_USER_ID,
        { needs_articles: false, needs_funds: true, needs_etfs: false, needs_distribution_mutual_funds: false }
    )

    console.log('\n  ── System prompt ──────────────────────────────────────')
    console.log(messages[0].content)
    console.log('\n  ── User message ───────────────────────────────────────')
    console.log(messages[1].content)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🧪 Fund Retrieval Test')
    console.log(`   Target userId: ${TEST_USER_ID}`)

    // Connect to MongoDB
    console.log('\n⏳ Connecting to MongoDB...')
    await mongoose.connect(ENVIRONMENT.mongoURI)
    console.log('✅ Connected')

    // Load the profile first so we can print it
    const profile = await Profile.findOne({ userId: new mongoose.Types.ObjectId(TEST_USER_ID) }).lean()
    if (!profile) {
        console.error(`\n❌ Profile not found for userId ${TEST_USER_ID}. Make sure the DB has this profile.`)
        process.exit(1)
    }

    section('LOADED PROFILE')
    console.log(`\n  risk_tolerance  : ${profile.risk_tolerance}`)
    console.log(`  savings_balance : $${profile.savings_balance}`)
    console.log(`  investment_exp  : ${profile.investment_experience}`)
    console.log(`  financial_goal  : ${profile.financial_goal}`)

    // Run the three stages
    await diagnoseFundCollection()
    const matchCount = await testRawQuery(profile)
    await testGetSFundInfo()

    if (matchCount > 0) {
        await testGeneratePrompt()
    } else {
        section('STAGE 3 — Skipped (no funds matched in Stage 1)')
        console.log('\n  Fix the filter issue above before running Stage 3.')
    }

    section('DONE')
    await mongoose.disconnect()
    process.exit(0)
}

main().catch(err => {
    console.error('\n💥 Unhandled error:', err)
    mongoose.disconnect()
    process.exit(1)
})
