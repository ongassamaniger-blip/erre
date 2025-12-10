
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySchema() {
    console.log('Verifying Schema...')

    // 1. Check Budgets Table
    console.log('\n--- Budgets Table ---')
    const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .limit(1)

    if (budgetError) {
        console.error('Error fetching budgets:', budgetError)
    } else {
        console.log('Budgets table accessible.')
        if (budgetData && budgetData.length > 0) {
            console.log('Sample budget keys:', Object.keys(budgetData[0]))
        } else {
            console.log('Budgets table is empty, cannot verify columns directly via select.')
            // Try to insert a dummy pending budget to verify columns
            const dummyBudget = {
                name: 'Test Budget',
                amount: 100,
                year: 2025,
                period: 'yearly',
                scope: 'department',
                scopeId: 'dummy', // This might fail constraint if FK exists
                status: 'pending',
                currency: 'TRY',
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                facility_id: 'dummy' // This might fail constraint
            }
            console.log('Attempting dry-run insert (will fail likely due to FKs but checking column existence)...')
            const { error: insertError } = await supabase.from('budgets').insert(dummyBudget)
            if (insertError) {
                console.log('Insert error (expected):', insertError.message)
                if (insertError.message.includes('column "status" does not exist')) {
                    console.error('CRITICAL: status column missing in budgets!')
                }
            }
        }
    }

    // 2. Check Projects Table
    console.log('\n--- Projects Table ---')
    const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('budget')
        .limit(1)

    if (projectError) {
        console.error('Error fetching projects:', projectError)
    } else {
        console.log('Projects table accessible.')
        if (projectData && projectData.length > 0) {
            console.log('Projects has budget column:', 'budget' in projectData[0])
        }
    }
}

verifySchema()
