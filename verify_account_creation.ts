
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

async function verifyAccountCreation() {
    console.log('Verifying Account Creation...')

    // Generate a random code to avoid conflicts
    const randomCode = 'TEST-' + Math.floor(Math.random() * 10000)

    const accountData = {
        code: randomCode,
        name: 'Test Account',
        type: 'expense',
        level: 1,
        is_active: true,
        // balance: 0, // Intentionally omitted
        currency: 'TRY',
        description: 'Test account created via verification script',
        // facility_id: '...' // We need a valid facility ID
    }

    // Get a facility ID first
    const { data: facility } = await supabase.from('facilities').select('id').limit(1).single()

    if (!facility) {
        console.error('No facility found to create account for.')
        return
    }

    console.log(`Using facility ID: ${facility.id}`)
    const dataWithFacility = { ...accountData, facility_id: facility.id }

    const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert(dataWithFacility)
        .select()
        .single()

    if (error) {
        console.error('Error creating account:', error)
        if (error.message.includes('balance')) {
            console.error('FAIL: Still trying to insert balance column?')
        }
    } else {
        console.log('Successfully created account:', data)

        // Clean up
        console.log('Cleaning up...')
        await supabase.from('chart_of_accounts').delete().eq('id', data.id)
        console.log('Cleanup done.')
    }
}

verifyAccountCreation()
