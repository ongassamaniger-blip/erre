
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

async function checkStatus() {
    console.log('Checking status column...')

    // Try to insert a dummy record with status 'archived' to see if it fails
    // We'll try to rollback or delete it immediately, or just rely on the error

    const dummy = {
        name: 'Test Status Check ' + Date.now(),
        type: 'vendor',
        status: 'archived'
    }

    const { data, error } = await supabase
        .from('vendors_customers')
        .insert(dummy)
        .select()

    if (error) {
        console.error('Error inserting with status archived:', error)
        // Check if error is about invalid input value for enum
    } else {
        console.log('Success! Status archived is accepted.')
        // Cleanup
        if (data && data[0]) {
            await supabase.from('vendors_customers').delete().eq('id', data[0].id)
        }
    }
}

checkStatus()
