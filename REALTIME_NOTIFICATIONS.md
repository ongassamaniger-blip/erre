# Real-Time Approval Notifications

This document describes the real-time notification system implemented for approval workflows in the Corporate Management System.

## Overview

The system provides automatic, real-time notifications when new approval requests are created, keeping managers and approvers instantly informed of pending actions.

## Features

### 1. Automatic Polling
- **Frequency**: Checks for new approvals every 30 seconds
- **Smart Detection**: Only notifies when new approvals are added
- **Background Operation**: Runs automatically when user is authenticated

### 2. Multi-Channel Notifications
- **Header Badge**: Animated badge on the notification bell icon
- **Toast Notifications**: Non-intrusive pop-up messages with action buttons
- **Notification Panel**: Detailed notification history in the header dropdown
- **Visual Indicators**: Real-time status indicators on the approvals page

### 3. Priority-Based Alerts
- **Urgent**: Red indicator with 🚨 emoji - immediate attention required
- **High**: Yellow indicator with ✋ emoji - needs prompt action
- **Medium/Low**: Blue indicator - standard notification

### 4. Interactive Notifications
- **Quick Actions**: "Görüntüle" (View) button in toast notifications
- **Direct Navigation**: Click notifications to go to approvals page
- **Mark as Read**: Automatically marks notifications as read when clicked

## Implementation

### Core Components

#### 1. `useApprovalNotifications` Hook
Location: `/src/hooks/use-approval-notifications.ts`

```typescript
const { lastCheck, checkNow } = useApprovalNotifications({
  enabled: true,
  pollInterval: 30000,
  onNewApproval: () => {
    // Handle new approval
  }
})
```

**Parameters:**
- `enabled`: Enable/disable polling (default: true)
- `pollInterval`: Check frequency in milliseconds (default: 30000)
- `onNewApproval`: Callback when new approval is detected

#### 2. NotificationProvider
Location: `/src/components/common/NotificationProvider.tsx`

Wraps the entire application to provide notification context:

```typescript
<NotificationProvider>
  <App />
</NotificationProvider>
```

#### 3. RealtimeIndicator Component
Location: `/src/components/common/RealtimeIndicator.tsx`

Visual indicator showing system is actively checking for updates:

```typescript
<RealtimeIndicator 
  lastCheck={lastCheck} 
  isActive={true} 
/>
```

### Integration Points

#### Approvals Page
- Auto-refreshes when new approvals arrive
- Shows real-time status indicator
- Manual refresh button available

#### Header Component
- Animated notification badge
- Notification panel with sorting and filtering
- "Mark all as read" functionality
- Approval-specific styling and icons

#### Auth Store
- Manages notification state
- Persists notifications across sessions
- Provides notification actions

## Testing

### Simulating New Approvals

For development and testing, use the approval simulator:

```typescript
import { addSimulatedApproval } from '@/services/approvalSimulator'

// Add a new test approval
const newApproval = addSimulatedApproval()
```

This will:
1. Create a new approval with random data
2. Trigger the notification system
3. Show a toast notification
4. Update the header badge
5. Refresh the approvals page (if open)

### Manual Testing Steps

1. **Login** to the system
2. **Navigate** to a page other than approvals
3. **Wait** up to 30 seconds or trigger a simulated approval
4. **Observe**:
   - Toast notification appears
   - Header bell icon shows badge with count
   - Click bell to see notification in panel
   - Click notification to navigate to approvals

## Configuration

### Polling Interval
Adjust in `useApprovalNotifications` hook:

```typescript
pollInterval: 30000 // 30 seconds (in milliseconds)
```

### Notification Types
Defined in `/src/types/notifications.ts`:

```typescript
type: 'approval' | 'approved' | 'rejected' | 'reminder' | ...
```

### Priority Levels
```typescript
priority: 'low' | 'medium' | 'high'
```

## Performance Considerations

### Optimizations
1. **Debouncing**: Prevents multiple simultaneous checks
2. **Reference Tracking**: Only triggers on actual new approvals
3. **Conditional Polling**: Stops when user logs out
4. **Efficient Filtering**: Minimal data processing on each check

### Resource Usage
- **Network**: 1 API call every 30 seconds
- **Memory**: Minimal - stores only approval count
- **CPU**: Negligible - simple comparison logic

## Future Enhancements

### Planned Features
1. **WebSocket Support**: Real-time push notifications
2. **Browser Notifications**: Native desktop notifications
3. **Sound Alerts**: Optional audio notifications
4. **Custom Rules**: User-defined notification preferences
5. **Digest Emails**: Periodic summary emails
6. **Mobile Push**: Integration with mobile apps

### Scalability
- Current implementation suitable for up to 1000 concurrent users
- For larger scale, migrate to WebSocket-based real-time communication
- Consider server-sent events (SSE) as an intermediate step

## Troubleshooting

### Notifications Not Appearing
1. Check if user is authenticated
2. Verify polling is enabled
3. Check browser console for errors
4. Ensure approval service is responding

### Performance Issues
1. Increase polling interval
2. Reduce notification history size
3. Implement pagination in notification panel
4. Consider caching approval counts

### Testing in Development
```typescript
// Force a notification check
const { checkNow } = useApprovalNotifications()
checkNow()

// Add test approval
addSimulatedApproval()
```

## API Reference

### useApprovalNotifications
```typescript
interface ApprovalNotificationOptions {
  enabled?: boolean        // Enable polling (default: true)
  pollInterval?: number    // Check interval in ms (default: 30000)
  onNewApproval?: () => void  // Callback on new approval
}

interface UseApprovalNotificationsReturn {
  lastCheck: Date         // Timestamp of last check
  checkNow: () => void    // Manual check trigger
}
```

### NotificationProvider Context
```typescript
interface NotificationContextType {
  lastApprovalCheck: Date
  refreshApprovals: () => void
  notificationCount: number
}
```

## Security

### Authentication
- Notifications only work for authenticated users
- Polling stops automatically on logout
- User can only see approvals they're authorized to view

### Data Privacy
- Notification data stored in auth store
- No sensitive data in notification titles
- Full details require navigation to approval page

## Browser Support

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- Mobile browsers: ✅ Supported with reduced animations

## Accessibility

- **Keyboard Navigation**: All notification actions keyboard-accessible
- **Screen Readers**: Proper ARIA labels on notification elements
- **Visual Indicators**: Multiple cues (color, icon, text)
- **Reduced Motion**: Respects user's motion preferences

## License

Part of the Corporate Management System - Internal Use Only
