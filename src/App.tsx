import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { AuthGuard } from '@/components/guards/AuthGuard'
import { FacilityGuard } from '@/components/guards/FacilityGuard'
import { MainLayout } from '@/components/layout/MainLayout'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { NotificationProvider } from '@/components/common/NotificationProvider'
import { ModuleGuard } from '@/components/guards/ModuleGuard'
// Lazy load pages
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const TenantSelectPage = lazy(() => import('@/features/tenant/TenantSelectPage').then(m => ({ default: m.TenantSelectPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const HeadquartersDashboardPage = lazy(() => import('@/features/dashboard/HeadquartersDashboardPage').then(m => ({ default: m.HeadquartersDashboardPage })))
const HeadquartersFinancePage = lazy(() => import('@/features/headquarters/HeadquartersFinancePage').then(m => ({ default: m.HeadquartersFinancePage })))
const HeadquartersHRPage = lazy(() => import('@/features/headquarters/HeadquartersHRPage').then(m => ({ default: m.HeadquartersHRPage })))
const HeadquartersProjectsPage = lazy(() => import('@/features/headquarters/HeadquartersProjectsPage').then(m => ({ default: m.HeadquartersProjectsPage })))
const HeadquartersQurbanPage = lazy(() => import('@/features/headquarters/HeadquartersQurbanPage').then(m => ({ default: m.HeadquartersQurbanPage })))
const HeadquartersSettingsPage = lazy(() => import('@/features/headquarters/HeadquartersSettingsPage').then(m => ({ default: m.HeadquartersSettingsPage })))
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage').then(m => ({ default: m.ProjectsPage })))
const ProjectDetailPage = lazy(() => import('@/features/projects/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })))
const QurbanPage = lazy(() => import('@/features/qurban/QurbanPage').then(m => ({ default: m.QurbanPage })))
const ReportCenterPage = lazy(() => import('@/features/reports/ReportCenterPage').then(m => ({ default: m.ReportCenterPage })))
const ReportGeneratePage = lazy(() => import('@/features/reports/ReportGeneratePage').then(m => ({ default: m.ReportGeneratePage })))

const ApprovalsPage = lazy(() => import('@/features/approvals/ApprovalsPage').then(m => ({ default: m.ApprovalsPage })))
const TransactionsPage = lazy(() => import('@/features/finance/transactions/TransactionsPage').then(m => ({ default: m.TransactionsPage })))
const TransactionDetailPage = lazy(() => import('@/features/finance/transactions/TransactionDetailPage').then(m => ({ default: m.TransactionDetailPage })))
const BudgetsPage = lazy(() => import('@/features/finance/budgets/BudgetsPage').then(m => ({ default: m.BudgetsPage })))
const FinanceReportsPage = lazy(() => import('@/features/finance/reports/FinanceReportsPage').then(m => ({ default: m.FinanceReportsPage })))
const ChartOfAccountsPage = lazy(() => import('@/features/finance/chart-of-accounts/ChartOfAccountsPage').then(m => ({ default: m.ChartOfAccountsPage })))
const VendorsCustomersPage = lazy(() => import('@/features/finance/vendors-customers/VendorsCustomersPage').then(m => ({ default: m.VendorsCustomersPage })))
const BudgetTransferPage = lazy(() => import('@/features/finance/budget-transfers/BudgetTransferPage').then(m => ({ default: m.BudgetTransferPage })))
const EmployeesPage = lazy(() => import('@/features/hr/employees/EmployeesPage').then(m => ({ default: m.EmployeesPage })))
const EmployeeDetailPage = lazy(() => import('@/features/hr/employees/EmployeeDetailPage').then(m => ({ default: m.EmployeeDetailPage })))
const LeavesPage = lazy(() => import('@/features/hr/leaves/LeavesPage').then(m => ({ default: m.LeavesPage })))
const AttendancePage = lazy(() => import('@/features/hr/attendance/AttendancePage').then(m => ({ default: m.AttendancePage })))
const PayrollPage = lazy(() => import('@/features/hr/payroll/PayrollPage').then(m => ({ default: m.PayrollPage })))
const DepartmentsPage = lazy(() => import('@/features/hr/departments/DepartmentsPage').then(m => ({ default: m.DepartmentsPage })))
const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })))
const BranchSettingsPage = lazy(() => import('@/features/settings/BranchSettingsPage').then(m => ({ default: m.BranchSettingsPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const isHydrated = useAuthStore(state => state.isHydrated)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Check for email confirmation in URL hash (Supabase uses hash-based URLs)
    const checkEmailConfirmation = () => {
      const hash = window.location.hash
      if (hash && (hash.includes('type=signup') || hash.includes('type=email') || hash.includes('type=recovery'))) {
        console.log('Email confirmation detected in hash')
        // Clear the hash and redirect to login
        supabase.auth.signOut().then(() => {
          window.location.href = '/login?confirmed=true'
        })
        return true
      }
      return false
    }

    // Check on mount
    if (checkEmailConfirmation()) {
      return
    }

    // Global auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event)

      // Only handle explicit sign out
      if (event === 'SIGNED_OUT') {
        useAuthStore.setState({
          user: null,
          session: null,
          selectedFacility: null,
          isAuthenticated: false,
          notifications: [],
          isInitialized: true
        })
      }

      // Handle password recovery - redirect to reset page
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/reset-password'
      }

      // For email confirmation, sign out and redirect to login
      // This prevents auto-login after email confirmation
      if (event === 'SIGNED_IN') {
        const hash = window.location.hash
        const urlParams = new URLSearchParams(window.location.search)
        const confirmed = urlParams.get('confirmed')

        // If coming from email confirmation (hash contains type or confirmed param exists)
        if (hash.includes('type=signup') || hash.includes('type=email') || hash.includes('access_token')) {
          console.log('Email confirmation sign-in detected, redirecting to login')
          supabase.auth.signOut().then(() => {
            window.location.href = '/login?confirmed=true'
          })
          return
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isHydrated) {
      setReady(true)
    } else {
      // Force ready after 1 second if hydration hangs
      const timer = setTimeout(() => setReady(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [isHydrated])

  if (!ready) {
    return <LoadingScreen />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              <Route element={<AuthGuard />}>
                <Route path="/tenant-select" element={<TenantSelectPage />} />

                <Route element={<FacilityGuard />}>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/headquarters/dashboard" element={<HeadquartersDashboardPage />} />

                    {/* Genel Merkez Modülleri */}
                    <Route path="/headquarters/finance" element={<HeadquartersFinancePage />} />
                    <Route path="/headquarters/hr" element={<HeadquartersHRPage />} />
                    <Route path="/headquarters/projects" element={<HeadquartersProjectsPage />} />
                    <Route path="/headquarters/qurban" element={<HeadquartersQurbanPage />} />
                    <Route path="/headquarters/settings" element={<HeadquartersSettingsPage />} />

                    {/* Finans Modülü - Seçmeli */}
                    <Route path="/finance/transactions" element={<ModuleGuard module="finance"><TransactionsPage /></ModuleGuard>} />
                    <Route path="/finance/transactions/:id" element={<ModuleGuard module="finance"><TransactionDetailPage /></ModuleGuard>} />
                    <Route path="/finance/budgets" element={<ModuleGuard module="finance"><BudgetsPage /></ModuleGuard>} />
                    <Route path="/finance/reports" element={<ModuleGuard module="finance"><FinanceReportsPage /></ModuleGuard>} />
                    <Route path="/finance/chart-of-accounts" element={<ModuleGuard module="finance"><ChartOfAccountsPage /></ModuleGuard>} />
                    <Route path="/finance/vendors-customers" element={<ModuleGuard module="finance"><VendorsCustomersPage /></ModuleGuard>} />
                    <Route path="/finance/budget-transfers" element={<BudgetTransferPage />} />

                    {/* İnsan Kaynakları Modülü - Seçmeli */}
                    <Route path="/hr/employees" element={<ModuleGuard module="hr"><EmployeesPage /></ModuleGuard>} />
                    <Route path="/hr/employees/:id" element={<ModuleGuard module="hr"><EmployeeDetailPage /></ModuleGuard>} />
                    <Route path="/hr/leaves" element={<ModuleGuard module="hr"><LeavesPage /></ModuleGuard>} />
                    <Route path="/hr/attendance" element={<ModuleGuard module="hr"><AttendancePage /></ModuleGuard>} />
                    <Route path="/hr/payroll" element={<ModuleGuard module="hr"><PayrollPage /></ModuleGuard>} />
                    <Route path="/hr/departments" element={<ModuleGuard module="hr"><DepartmentsPage /></ModuleGuard>} />

                    {/* Projeler Modülü - Standart */}
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/projects/:id" element={<ProjectDetailPage />} />

                    {/* Kurban Modülü - Seçmeli */}
                    <Route path="/qurban" element={<ModuleGuard module="qurban"><QurbanPage /></ModuleGuard>} />
                    <Route path="/reports/center" element={<ReportCenterPage />} />
                    <Route path="/reports/generate/:reportId" element={<ReportGeneratePage />} />

                    <Route path="/approvals" element={<ApprovalsPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/settings/branch" element={<BranchSettingsPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </NotificationProvider>
    </QueryClientProvider>
  )
}

export default App