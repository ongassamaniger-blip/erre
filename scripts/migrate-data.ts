import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
})

import { mockFacilities } from '../src/data/mockFacilities.js'
import { mockCategories, mockVendorsCustomers } from '../src/data/mockFinanceData.js'
import { mockDepartments, mockEmployees, mockLeaveRequests } from '../src/data/mockHRData.js'

const mockUsers = [
    { email: 'admin@example.com', password: '123456', name: 'Ahmet Yılmaz', role: 'Super Admin' as const, facilityAccess: ['GM01', 'NIM01', 'IST01', 'ANK01'] },
    { email: 'manager@example.com', password: '123456', name: 'Ayşe Demir', role: 'Manager' as const, facilityAccess: ['IST01'] },
    { email: 'headquarters@example.com', password: '123456', name: 'Genel Merkez Yöneticisi', role: 'Super Admin' as const, facilityAccess: ['GM01'] }
]

async function main() {
    console.log('🚀 Starting Migration...\\n')

    // Facilities
    console.log('🏢 Migrating Facilities...')
    for (const f of mockFacilities) {
        const { error } = await supabase.from('facilities').upsert({ id: f.id, code: f.code, name: f.name, location: f.location, type: f.type, parent_facility_id: f.parentFacilityId, enabled_modules: f.enabledModules || ['finance', 'hr', 'projects', 'qurban'] })
        if (error) console.error(`  ❌ ${f.name}:`, error.message)
        else console.log(`  ✅ ${f.name}`)
    }

    // Categories
    console.log('\\n📊 Migrating Categories...')
    for (const c of mockCategories) {
        const { error } = await supabase.from('categories').upsert({ id: c.id, name: c.name, type: c.type, parent_id: c.parentId, color: c.color, facility_id: c.facilityId })
        if (error) console.error(`  ❌ ${c.name}:`, error.message)
    }
    console.log(`  ✅ ${mockCategories.length} categories`)

    // Vendors/Customers
    console.log('\\n🏪 Migrating Vendors/Customers...')
    for (const v of mockVendorsCustomers) {
        const { error } = await supabase.from('vendors_customers').upsert({ id: v.id, name: v.name, type: v.type, tax_number: v.taxNumber, email: v.email, phone: v.phone, address: v.address, city: v.city, country: v.country, contact_person: v.contactPerson, facility_id: v.facilityId })
        if (error) console.error(`  ❌ ${v.name}:`, error.message)
    }
    console.log(`  ✅ ${mockVendorsCustomers.length} vendors/customers`)

    // Departments
    console.log('\\n🏛️ Migrating Departments...')
    for (const d of mockDepartments) {
        const { error } = await supabase.from('departments').upsert({ id: d.id, facility_id: d.facilityId, name: d.name, code: d.code, manager_name: d.managerName, employee_count: d.employeeCount, description: d.description })
        if (error) console.error(`  ❌ ${d.name}:`, error.message)
    }
    console.log(`  ✅ ${mockDepartments.length} departments`)

    // Employees
    console.log('\\n👤 Migrating Employees...')
    for (const e of mockEmployees) {
        const { error } = await supabase.from('employees').upsert({ id: e.id, facility_id: e.facilityId, code: e.code, first_name: e.firstName, last_name: e.lastName, national_id: e.nationalId, date_of_birth: e.dateOfBirth, nationality: e.nationality, gender: e.gender, marital_status: e.maritalStatus, phone: e.phone, email: e.email, address: e.address, emergency_contact: e.emergencyContact, department: e.department, position: e.position, employment_type: e.employmentType, status: e.status, hire_date: e.hireDate, contract_start_date: e.contractStartDate, working_hours: e.workingHours, salary: e.salary, leave_entitlements: e.leaveEntitlements, documents: e.documents })
        if (error) console.error(`  ❌ ${e.firstName} ${e.lastName}:`, error.message)
    }
    console.log(`  ✅ ${mockEmployees.length} employees`)

    // Leave Requests
    console.log('\\n📅 Migrating Leave Requests...')
    for (const l of mockLeaveRequests) {
        const { error } = await supabase.from('leave_requests').upsert({ id: l.id, facility_id: l.facilityId, employee_id: l.employeeId, employee_name: l.employeeName, leave_type: l.leaveType, start_date: l.startDate, end_date: l.endDate, total_days: l.totalDays, reason: l.reason, status: l.status, approver_id: l.approverId, approver_name: l.approverName, approval_date: l.approvalDate })
        if (error) console.error(`  ❌ Leave request:`, error.message)
    }
    console.log(`  ✅ ${mockLeaveRequests.length} leave requests`)

    // Users (manual creation needed)
    console.log('\\n👥 User Creation Info:')
    console.log('⚠️  Users need to be created manually in Supabase Dashboard:')
    console.log('   Go to Authentication > Users > Add User')
    for (const u of mockUsers) {
        console.log(`   - ${u.email} / ${u.password} (${u.role})`)
    }

    console.log('\\n✅ Migration Complete!')
    console.log('\\nNext: Create users in Supabase Dashboard, then test login')
}

main().catch(console.error)
