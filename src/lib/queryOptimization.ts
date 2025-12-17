/**
 * Query Optimization Utilities
 * 
 * Bu dosya query optimizasyonu için yardımcı fonksiyonlar içerir.
 */

/**
 * Spesifik kolonlar için transaction select string'i
 * SELECT * yerine sadece ihtiyaç duyulan kolonları çeker
 */
export const TRANSACTION_SELECT_COLUMNS = `
  id,
  transaction_number,
  type,
  date,
  amount,
  currency,
  exchange_rate,
  amount_in_base_currency,
  category_id,
  description,
  vendor_customer_id,
  project_id,
  department_id,
  payment_method,
  status,
  documents,
  notes,
  facility_id,
  created_by,
  created_at,
  updated_at,
  approval_steps,
  activity_log,
  categories(name),
  vendors_customers(name),
  departments(name),
  projects(name)
`

/**
 * Spesifik kolonlar için project select string'i
 */
export const PROJECT_SELECT_COLUMNS = `
  id,
  facility_id,
  name,
  description,
  status,
  priority,
  start_date,
  end_date,
  budget,
  spent_budget,
  manager_id,
  category_id,
  type_id,
  progress,
  total_tasks,
  completed_tasks,
  total_team_members,
  tags,
  is_deleted,
  created_at,
  updated_at
`

/**
 * Spesifik kolonlar için employee select string'i
 */
export const EMPLOYEE_SELECT_COLUMNS = `
  id,
  facility_id,
  first_name,
  last_name,
  email,
  phone,
  code,
  position,
  department,
  status,
  hire_date,
  salary,
  created_at,
  updated_at
`

/**
 * Spesifik kolonlar için budget select string'i
 */
export const BUDGET_SELECT_COLUMNS = `
  id,
  facility_id,
  name,
  year,
  period,
  total_amount,
  spent_amount,
  status,
  currency,
  start_date,
  end_date,
  department_id,
  project_id,
  category_id,
  created_at,
  updated_at,
  departments(name),
  projects(name)
`

/**
 * Maximum limit for getAll functions to prevent memory issues
 */
export const MAX_GET_ALL_LIMIT = 10000

/**
 * Default page size for pagination
 */
export const DEFAULT_PAGE_SIZE = 20

/**
 * Cache time constants (in milliseconds)
 */
export const CACHE_TIMES = {
  SHORT: 1 * 60 * 1000,      // 1 dakika
  MEDIUM: 5 * 60 * 1000,     // 5 dakika
  LONG: 15 * 60 * 1000,      // 15 dakika
  VERY_LONG: 30 * 60 * 1000, // 30 dakika
}

/**
 * Stale time constants (in milliseconds)
 */
export const STALE_TIMES = {
  SHORT: 30 * 1000,          // 30 saniye
  MEDIUM: 2 * 60 * 1000,     // 2 dakika
  LONG: 5 * 60 * 1000,       // 5 dakika
  VERY_LONG: 10 * 60 * 1000, // 10 dakika
}

/**
 * Helper to add limit to getAll queries
 */
export function addLimitToQuery(query: any, limit: number = MAX_GET_ALL_LIMIT) {
  return query.limit(limit)
}

/**
 * Helper to check if query result is too large
 */
export function checkResultSize<T>(data: T[], maxSize: number = MAX_GET_ALL_LIMIT): boolean {
  return data.length <= maxSize
}

