# Global Corporate Management System - Plan 1

A comprehensive multi-facility corporate management system with authentication, facility selection, and dynamic dashboards.

**Experience Qualities**:
1. **Professional** - Clean, organized interface that instills confidence in enterprise users
2. **Efficient** - Quick navigation and data access with minimal friction
3. **Intelligent** - Smart defaults and contextual information presentation

**Complexity Level**: Complex Application (advanced functionality, accounts)
- Multi-tenant architecture with facility-based access control
- Role-based permissions and dynamic routing
- Real-time dashboard metrics with data visualization

## Essential Features

### Authentication System
- **Functionality**: Secure login with email/password, mock authentication for development
- **Purpose**: Validate user identity and establish session
- **Trigger**: User navigates to app without valid session
- **Progression**: Login page → Credentials entry → Validation → Facility selection (if multiple) → Dashboard
- **Success criteria**: User can log in and session persists across page refreshes

### Multi-Facility Selection
- **Functionality**: Users with multiple facility access can choose which facility to manage
- **Purpose**: Enable multi-location management with proper context switching
- **Trigger**: Successful authentication with multiple facility assignments
- **Progression**: Authentication → Facility grid display → User selects facility → Context stored → Redirect to dashboard
- **Success criteria**: Selected facility context persists and affects all data views

### Dynamic Dashboard
- **Functionality**: Facility-specific metrics, charts, and recent activity
- **Purpose**: Provide at-a-glance overview of key business metrics
- **Trigger**: User selects facility or has single facility access
- **Progression**: Load facility context → Fetch metrics → Render KPIs → Display charts → Show recent transactions
- **Success criteria**: All data reflects selected facility, updates on facility change

### Navigation System
- **Functionality**: Collapsible sidebar with module navigation, breadcrumbs, header with facility selector
- **Purpose**: Enable quick access to all system modules
- **Trigger**: User is authenticated and facility is selected
- **Progression**: Sidebar menu click → Route change → Content updates → Breadcrumb updates
- **Success criteria**: All routes accessible, current location always clear

### Notification Center
- **Functionality**: Badge-based notification indicator with dropdown
- **Purpose**: Alert users to pending approvals and important updates
- **Trigger**: New notifications arrive or user clicks notification icon
- **Progression**: Icon badge displays count → User clicks → Dropdown shows list → User can mark as read
- **Success criteria**: Count updates dynamically, notifications dismissible

## Edge Case Handling
- **No facility access**: Redirect to error page with contact admin message
- **Session expiry**: Auto-redirect to login with return URL preserved
- **Network errors**: Show toast notifications with retry options
- **Missing data**: Display empty states with helpful guidance
- **Permission denied**: Show appropriate message, hide unauthorized features

## Design Direction
The design should feel professional and trustworthy, balancing corporate polish with modern usability - a clean, confident interface that feels efficient rather than flashy, with subtle animations that guide rather than distract.

## Color Selection
Triadic color scheme using professional blues, supportive greens, and accent oranges to create a balanced, trustworthy corporate aesthetic.

- **Primary Color**: Deep Blue (oklch(0.45 0.12 250)) - Conveys trust, professionalism, stability
- **Secondary Colors**: 
  - Neutral Gray (oklch(0.65 0.02 250)) - Supporting text and backgrounds
  - Light background (oklch(0.98 0.01 250)) - Page backgrounds
- **Accent Color**: Vibrant Orange (oklch(0.68 0.18 45)) - CTAs, highlights, important metrics
- **Foreground/Background Pairings**:
  - Background (Light Gray oklch(0.98 0.01 250)): Dark Text (oklch(0.25 0.02 250)) - Ratio 12.1:1 ✓
  - Primary (Deep Blue oklch(0.45 0.12 250)): White Text (oklch(1 0 0)) - Ratio 7.8:1 ✓
  - Accent (Vibrant Orange oklch(0.68 0.18 45)): Dark Text (oklch(0.25 0.02 250)) - Ratio 5.2:1 ✓
  - Card (White oklch(1 0 0)): Dark Text (oklch(0.25 0.02 250)) - Ratio 14.3:1 ✓

## Font Selection
Use Inter for its exceptional readability in data-heavy interfaces and professional appearance across all weights.

- **Typographic Hierarchy**:
  - H1 (Page Titles): Inter SemiBold/32px/tight letter spacing/-0.02em
  - H2 (Section Headers): Inter SemiBold/24px/normal letter spacing/-0.01em
  - H3 (Card Headers): Inter Medium/18px/normal letter spacing
  - Body (Content): Inter Regular/14px/relaxed line height/1.6
  - Small (Meta): Inter Regular/12px/normal line height/1.5
  - Button Labels: Inter Medium/14px/normal letter spacing

## Animations
Subtle, purposeful animations that enhance usability - sidebar transitions feel smooth, cards lift on hover to indicate interactivity, data updates fade gracefully.

- **Purposeful Meaning**: Motion reinforces hierarchy and action feedback
- **Hierarchy of Movement**: Primary actions get subtle scale, navigation transitions slide, data loading uses skeleton states

## Component Selection
- **Components**: 
  - Sidebar navigation with collapse (custom with shadcn Sheet on mobile)
  - Card for KPI metrics, dashboards, facility selection
  - Button for primary actions with loading states
  - DropdownMenu for user menu, facility selector
  - Badge for notification counts
  - Table for transaction lists
  - Skeleton for loading states
  - Breadcrumb for navigation context
  - Avatar for user profile
  - Separator for visual grouping
  - Recharts for data visualization
- **Customizations**: 
  - Custom collapsible sidebar with animation
  - KPI cards with hover effects and trend indicators
  - Facility selection cards with role badges
- **States**: 
  - Buttons: default, hover (slight scale + deeper shadow), active (scale down), disabled (opacity 50%)
  - Inputs: default, focus (ring + border color), error (red border + shake), filled (checked icon)
  - Cards: default, hover (lift + shadow), selected (border accent)
- **Icon Selection**: Phosphor icons - Buildings for facilities, ChartBar for dashboard, Bell for notifications, User for profile
- **Spacing**: Consistent 4px grid - sm:8px, md:16px, lg:24px, xl:32px
- **Mobile**: Sidebar becomes sheet drawer, KPI cards stack vertically, tables become scrollable cards, charts maintain aspect ratio
