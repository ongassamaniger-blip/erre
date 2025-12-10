import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { approvalService } from '@/services/approvalService'
import { toast } from 'sonner'

interface ApprovalNotificationOptions {
  enabled?: boolean
  pollInterval?: number
  onNewApproval?: () => void
}

// Global state to prevent duplicate checks across component remounts
const globalState = {
  lastCheckTime: 0,
  notifiedApprovalIds: new Set<string>(),
  isChecking: false,
  previousPendingCount: -1
}

export function useApprovalNotifications(options: ApprovalNotificationOptions = {}) {
  const {
    enabled = true,
    pollInterval = 60000, // Increased to 60 seconds
    onNewApproval
  } = options

  const addNotification = useAuthStore(state => state.addNotification)
  const user = useAuthStore(state => state.user)
  const lastCheckRef = useRef<Date>(new Date())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const checkForNewApprovals = useCallback(async () => {
    // Prevent duplicate calls
    if (globalState.isChecking || !user) return

    // Debounce - don't check more than once per 10 seconds
    const now = Date.now()
    if (now - globalState.lastCheckTime < 10000) return

    globalState.isChecking = true
    globalState.lastCheckTime = now

    try {
      const stats = await approvalService.getStats()
      const approvals = await approvalService.getApprovals({ status: 'pending' })

      // Only notify for genuinely new approvals
      if (globalState.previousPendingCount >= 0 && stats.pending > globalState.previousPendingCount) {
        const newCount = stats.pending - globalState.previousPendingCount

        // Find truly new approvals that we haven't notified about
        const newApprovals = approvals
          .filter(a => !globalState.notifiedApprovalIds.has(a.id))
          .slice(0, newCount)

        if (newApprovals.length > 0) {
          const isApprovalsPage = window.location.pathname.startsWith('/approvals')

          if (!isApprovalsPage) {
            // Only show one consolidated notification
            const notificationTitle = newApprovals.length > 1
              ? `✋ ${newApprovals.length} Yeni Onay Talebi`
              : '✋ Yeni Onay Talebi'

            const notificationMessage = newApprovals.length > 1
              ? `${newApprovals.length} yeni onay bekleyen işleminiz var.`
              : newApprovals[0].title

            addNotification({
              type: 'approval',
              title: notificationTitle,
              message: notificationMessage,
              read: false,
              link: '/approvals',
              priority: 'medium'
            })

            toast.info(notificationTitle, {
              description: notificationMessage,
              action: {
                label: 'Görüntüle',
                onClick: () => {
                  window.location.href = '/approvals'
                }
              },
              duration: 5000
            })

          }

          // Mark these as notified
          newApprovals.forEach(a => globalState.notifiedApprovalIds.add(a.id))

          if (onNewApproval) {
            onNewApproval()
          }
        }
      } else if (globalState.previousPendingCount === -1 && stats.pending > 0) {
        // First check - just update the count, don't notify
        // Mark existing as notified to prevent future false positives
        approvals.forEach(a => globalState.notifiedApprovalIds.add(a.id))
      }

      globalState.previousPendingCount = stats.pending
      lastCheckRef.current = new Date()
    } catch (error) {
      console.error('Error checking for new approvals:', error)
    } finally {
      globalState.isChecking = false
    }
  }, [user, addNotification, onNewApproval])

  useEffect(() => {
    if (!enabled || !user) return

    // Initial check with delay to prevent race conditions
    const initialTimeout = setTimeout(() => {
      checkForNewApprovals()
    }, 2000)

    // Set up polling
    intervalRef.current = setInterval(checkForNewApprovals, pollInterval)

    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, user?.id, pollInterval]) // Only re-run when user id changes

  return {
    lastCheck: lastCheckRef.current,
    checkNow: checkForNewApprovals
  }
}
