
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('Checking vendors_customers table schema...')

    // Try to select is_active
    const { data, error } = await supabase
        .from('vendors_customers')
        .select('is_active')
        .limit(1)

    if (error) {
        console.error('Error selecting is_active:', error)
        console.log('It seems the is_active column DOES NOT exist.')
    } else {
        console.log('Successfully selected is_active. The column exists.')
    }
}

checkSchema()
