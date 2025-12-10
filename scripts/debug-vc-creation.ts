import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
    console.log('Testing insert with status: pending...')
    const { data, error } = await supabase
        .from('vendors_customers')
        .insert({
            name: 'Debug Vendor ' + Date.now(),
            type: 'vendor',
            status: 'pending',
            is_active: true
        })
        .select()
        .single()

    if (error) {
        console.error('Insert Error:', JSON.stringify(error, null, 2))
    } else {
        console.log('Insert Success:', data)
        // Clean up
        await supabase.from('vendors_customers').delete().eq('id', data.id)
    }
}

testInsert()
