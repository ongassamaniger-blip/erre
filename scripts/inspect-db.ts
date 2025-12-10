
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
    console.log('Inspecting vendors_customers...')

    // 1. Fetch one row to see columns
    const { data, error } = await supabase
        .from('vendors_customers')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching row:', error)
    } else if (data && data.length > 0) {
        console.log('Available columns:', Object.keys(data[0]))
    } else {
        console.log('No rows found, cannot inspect columns via select *')
    }

    // 2. Try to query with status = archived
    const { error: statusError } = await supabase
        .from('vendors_customers')
        .select('id')
        .eq('status', 'archived')
        .limit(1)

    if (statusError) {
        console.error('Error querying status=archived:', statusError)
    } else {
        console.log('Querying status=archived did not throw DB error (might return empty data)')
    }
}

inspectTable()
