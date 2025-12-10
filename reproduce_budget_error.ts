
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function reproduceBudgetError() {
    console.log('Attempting to create a budget...')

    // 1. Get a facility ID
    const { data: facility } = await supabase.from('facilities').select('id').limit(1).single()

    if (!facility) {
        console.error('No facility found to test with.')
        return
    }
    console.log('Using facility:', facility.id)

    // 2. Get a department ID (for scope)
    const { data: department } = await supabase.from('departments').select('id').limit(1).single()
    if (!department) {
        console.error('No department found.')
        return
    }

    // 3. Try to insert a budget
    const budgetData = {
        name: 'Test Budget Error',
        year: 2025,
        period: 'yearly',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        total_amount: 10000,
        currency: 'TRY',
        status: 'draft',
        department_id: department.id,
        facility_id: facility.id
    }

    console.log('Inserting budget data:', budgetData)

    const { data, error } = await supabase
        .from('budgets')
        .insert(budgetData)
        .select()
        .single()

    if (error) {
        console.error('❌ Error creating budget:', error)
    } else {
        console.log('✅ Budget created successfully:', data.id)
        // Cleanup
        await supabase.from('budgets').delete().eq('id', data.id)
    }
}

reproduceBudgetError()
