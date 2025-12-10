
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

async function verifyDeleteError() {
    console.log('Verifying Delete Error...')

    // 1. Create a test vendor
    const { data: vendor, error: vendorError } = await supabase
        .from('vendors_customers')
        .insert({
            name: 'Test Vendor for Delete',
            type: 'vendor',
            facility_id: '123e4567-e89b-12d3-a456-426614174000' // Assuming a valid UUID or I should fetch one
        })
        .select()
        .single()

    if (vendorError) {
        // If facility_id fails, try fetching a facility
        const { data: facility } = await supabase.from('facilities').select('id').limit(1).single()
        if (facility) {
            const { data: vendor2, error: vendorError2 } = await supabase
                .from('vendors_customers')
                .insert({
                    name: 'Test Vendor for Delete',
                    type: 'vendor',
                    facility_id: facility.id
                })
                .select()
                .single()
            if (vendorError2) {
                console.error('Failed to create vendor:', vendorError2)
                return
            }
            console.log('Created vendor:', vendor2.id)

            // 2. Create a transaction linked to this vendor
            const { data: transaction, error: txError } = await supabase
                .from('transactions')
                .insert({
                    type: 'expense',
                    date: new Date().toISOString(),
                    amount: 100,
                    currency: 'TRY',
                    title: 'Test Transaction',
                    description: 'Test',
                    payment_method: 'cash',
                    status: 'pending',
                    vendor_customer_id: vendor2.id,
                    facility_id: facility.id,
                    category_id: (await supabase.from('categories').select('id').limit(1).single()).data?.id
                })
                .select()
                .single()

            if (txError) {
                console.error('Failed to create transaction:', txError)
                // Try to delete vendor anyway
                await supabase.from('vendors_customers').delete().eq('id', vendor2.id)
                return
            }
            console.log('Created transaction linked to vendor:', transaction.id)

            // 3. Try to delete the vendor
            console.log('Attempting to delete vendor...')
            const { error: deleteError } = await supabase
                .from('vendors_customers')
                .delete()
                .eq('id', vendor2.id)

            if (deleteError) {
                console.log('Caught expected error:', deleteError)
            } else {
                console.log('Unexpected: Vendor deleted successfully!')
            }

            // Cleanup if needed (if delete failed)
            // We might want to leave it to see the error, but for script cleanliness:
            if (deleteError) {
                console.log('Cleaning up transaction first...')
                await supabase.from('transactions').delete().eq('id', transaction.id)
                console.log('Deleting vendor...')
                await supabase.from('vendors_customers').delete().eq('id', vendor2.id)
                console.log('Cleanup complete.')
            }

        } else {
            console.error('No facility found')
        }
    }
}

verifyDeleteError()
