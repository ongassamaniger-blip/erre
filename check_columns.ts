
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

async function checkColumns() {
    console.log('Checking columns...')
    const { data, error } = await supabase
        .from('vendors_customers')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error:', error)
    } else {
        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]))
        } else {
            console.log('No data found, cannot infer columns easily without metadata query which might be restricted.')
            // Try to insert a dummy to see error or something? No.
        }
    }
}

checkColumns()
