import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSignup() {
    const email = `test_${uuidv4().slice(0, 8)}@example.com`
    const password = 'password123'

    console.log(`Attempting signup with ${email}...`)

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    })

    if (error) {
        console.error('Signup error:', error.message)
    } else {
        console.log('Signup success!')
        if (data.session) {
            console.log('✅ GOT SESSION! We can use this for testing.')
        } else {
            console.log('❌ No session returned (Email confirmation likely required).')
        }
    }
}

testSignup()
