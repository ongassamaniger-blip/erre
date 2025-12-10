import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function resetPassword() {
    const email = 'admin@example.com'
    const password = '123456'

    console.log(`Resetting password for ${email}...`)

    const { data: users, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
        console.error('Error listing users:', listError.message)
        return
    }

    const user = users.users.find(u => u.email === email)

    if (user) {
        const { error } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: password, email_confirm: true }
        )

        if (error) {
            console.error('Error updating user:', error.message)
        } else {
            console.log('✅ Password updated successfully!')
        }
    } else {
        console.log('User not found, creating...')
        const { error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: 'Ahmet Yılmaz', role: 'Super Admin' }
        })

        if (error) {
            console.error('Error creating user:', error.message)
        } else {
            console.log('✅ User created successfully!')
        }
    }
}

resetPassword()
