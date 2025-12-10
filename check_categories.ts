
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCategories() {
    const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Categories:', JSON.stringify(data, null, 2))
    }
}

checkCategories()
