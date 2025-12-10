
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

async function inspectTable() {
    console.log('Inspecting vendors_customers for notes column...')

    // Fetch one row to see columns
    const { data, error } = await supabase
        .from('vendors_customers')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching row:', error)
    } else if (data && data.length > 0) {
        console.log('Available columns:', Object.keys(data[0]))
        if ('notes' in data[0]) {
            console.log('Column "notes" EXISTS.')
        } else {
            console.log('Column "notes" does NOT exist.')
        }
    } else {
        console.log('No rows found, cannot inspect columns via select *')
        // Try to select 'notes' specifically to see if it errors
        const { error: notesError } = await supabase
            .from('vendors_customers')
            .select('notes')
            .limit(1)

        if (notesError) {
            console.error('Error selecting notes:', notesError.message)
        } else {
            console.log('Selecting "notes" succeeded (even if no data returned).')
        }
    }
}

inspectTable()
