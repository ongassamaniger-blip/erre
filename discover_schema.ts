
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertDummy() {
    console.log('Inserting dummy...')
    // Need a facility ID. I'll fetch one first.
    const { data: facility } = await supabase.from('facilities').select('id').limit(1).single()

    if (!facility) {
        console.log('No facility found, cannot insert.')
        return
    }

    const { data, error } = await supabase
        .from('vendors_customers')
        .insert({
            name: 'Schema Discovery Dummy',
            type: 'vendor',
            facility_id: facility.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Columns:', Object.keys(data))
        // Cleanup
        await supabase.from('vendors_customers').delete().eq('id', data.id)
    }
}

insertDummy()
