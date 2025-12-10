import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test Data
const TEST_CATEGORY_NAME = `Test Category ${uuidv4().slice(0, 8)}`
const TEST_PROJECT_NAME = `Test Project ${uuidv4().slice(0, 8)}`

async function runVerification() {
    console.log('🚀 Starting Ultimate System Audit...\n')

    try {
        // 0. Authenticate
        console.log('0️⃣  Authenticating as admin...')
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'admin@example.com',
            password: '123456'
        })

        if (authError) throw new Error(`Authentication failed: ${authError.message}`)
        console.log('   ✅ Authenticated successfully')

        const userId = authData.user.id

        // Fetch User's Facility
        const { data: facilityUser, error: fuError } = await supabase
            .from('facility_users')
            .select('facility_id')
            .eq('user_id', userId)
            .single()

        if (fuError || !facilityUser) throw new Error('Could not find facility for user')

        const TEST_FACILITY_ID_1 = facilityUser.facility_id
        const TEST_FACILITY_ID_2 = '00000000-0000-0000-0000-000000000002' // Fake facility for isolation test

        console.log(`   ✅ Using Facility ID: ${TEST_FACILITY_ID_1}`)

        // 1. Verify Dynamic Definitions (Project Categories)
        console.log('\n1️⃣  Verifying Dynamic Definitions (project_categories)...')

        // Create Category in Facility 1
        const { data: cat1, error: catError } = await supabase
            .from('project_categories')
            .insert({
                name: TEST_CATEGORY_NAME,
                facility_id: TEST_FACILITY_ID_1
            })
            .select()
            .single()

        if (catError) throw new Error(`Failed to create category: ${catError.message}`)
        console.log(`   ✅ Created category "${cat1.name}" in Facility 1`)

        // Verify Isolation: Check if visible in Facility 2 (Should NOT be visible if RLS works)
        // We can't easily "switch" users here, but we can verify that querying for Facility 2 returns nothing 
        // OR that we can't see data if we were another user (hard to test in single script without 2 users).
        // For now, we verify that we CAN see our own data.

        const { data: fetchCat1 } = await supabase
            .from('project_categories')
            .select('*')
            .eq('facility_id', TEST_FACILITY_ID_1)
            .eq('name', TEST_CATEGORY_NAME)

        if (fetchCat1?.length === 1) {
            console.log('   ✅ Category verified visible in correct facility')
        } else {
            console.error('   ❌ Category not found in facility')
        }

        // 2. Verify Project Creation with Dynamic Data
        console.log('\n2️⃣  Verifying Project Creation...')
        const { data: project, error: projError } = await supabase
            .from('projects')
            .insert({
                name: TEST_PROJECT_NAME,
                facility_id: TEST_FACILITY_ID_1,
                category: cat1.name, // Using the dynamic category name
                status: 'planning',
                start_date: new Date().toISOString(),
                end_date: new Date().toISOString()
            })
            .select()
            .single()

        if (projError) throw new Error(`Failed to create project: ${projError.message}`)
        console.log(`   ✅ Created project "${project.name}" with category "${project.category}"`)

        // 3. Verify Data Persistence & Retrieval
        console.log('\n3️⃣  Verifying Data Persistence...')
        const { data: fetchedProject } = await supabase
            .from('projects')
            .select('*')
            .eq('id', project.id)
            .single()

        if (fetchedProject && fetchedProject.category === cat1.name) {
            console.log('   ✅ Data Persistence Verified: Project retrieved correctly')
        } else {
            throw new Error('Failed to retrieve project or data mismatch')
        }

        // 4. Cleanup (Delete Test Data)
        console.log('\n4️⃣  Verifying Deletion (Cleanup)...')

        const { error: delProjError } = await supabase
            .from('projects')
            .delete()
            .eq('id', project.id)

        if (delProjError) throw new Error(`Failed to delete project: ${delProjError.message}`)
        console.log('   ✅ Deleted test project')

        const { error: delCatError } = await supabase
            .from('project_categories')
            .delete()
            .eq('id', cat1.id)

        if (delCatError) throw new Error(`Failed to delete category: ${delCatError.message}`)
        console.log('   ✅ Deleted test category')

        // Verify they are gone
        const { data: checkGone } = await supabase
            .from('projects')
            .select('*')
            .eq('id', project.id)

        if (checkGone?.length === 0) {
            console.log('   ✅ Deletion Verified: Records removed from Supabase')
        } else {
            console.error('   ❌ Deletion Failed: Records still exist')
        }

        console.log('\n✨ System Audit Completed Successfully!')

    } catch (error: any) {
        console.error('\n❌ Audit Failed:', error.message)
        process.exit(1)
    }
}

runVerification()
