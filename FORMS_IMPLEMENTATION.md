# Form Management System Implementation

This document describes the comprehensive form management system that has been implemented in the NGO management application.

## Overview

The form management system allows administrators to manage form templates used throughout the application from a centralized location under Settings. This provides flexibility to customize forms without code changes.

## Architecture

### 1. Type Definitions (`src/types/forms.ts`)

Core types that define the structure of form templates:

- **FormTemplateCode**: Enum of available form types
  - `finance.transaction` - Financial transaction forms
  - `projects.project` - Project creation forms
  - `qurban.sacrifice` - Qurban donation forms
  - `hr.employee` - Employee registration forms
  - `hr.leave` - Leave request forms

- **Locale**: Supported languages (`tr`, `en`, `fr`, `ar`)

- **TranslatedText**: Multi-language text support

- **FormFieldType**: Available field types
  - text, textarea, number, select, date, datetime, checkbox, radio, file

- **FormField**: Individual form field configuration
  - Includes visibility, required status, ordering, role restrictions, and conditional display

- **FormTemplate**: Complete form template structure
  - Contains metadata and array of form fields
  - Supports both global and tenant-specific templates

### 2. Form Service (`src/services/formsService.ts`)

Mock service that manages form templates:

- **getFormTemplates(tenantId)**: Returns all templates (global + tenant-specific)
- **getFormTemplateByCode(code, tenantId)**: Gets specific template with tenant override support
- **updateFormTemplate(template)**: Updates existing template
- **createTenantOverride(code, tenantId, userId)**: Creates tenant-specific override of global template

Currently uses in-memory storage with mock data. Ready to be replaced with API calls when backend is available.

### 3. UI Components

#### FormsPage (`src/features/settings/forms/FormsPage.tsx`)

List view of all form templates:
- Shows form name, code, scope (Global/Tenant), version, field count
- Edit button navigates to detail page
- Role-based access control (only Super Admin and Admin can access)
- Integrated with React Query for data fetching

#### FormEditPage (`src/features/settings/forms/FormEditPage.tsx`)

Detailed form field management interface:
- **Left Panel**: Draggable list of form fields
  - Toggle visibility with eye icon
  - Reorder fields with up/down buttons
  - See required status and field key
  - Click to select and edit

- **Right Panel**: Selected field details
  - Basic information (key, type - read-only)
  - Visibility and required toggles
  - Multi-language label editing (TR/EN/FR/AR tabs)
  - Placeholder text editing
  - Role restrictions display

Features:
- Real-time change detection
- Unsaved changes warning
- Save button with loading state
- Breadcrumb navigation
- Template version display

#### DynamicForm Component (`src/components/forms/DynamicForm.tsx`)

Reusable component that renders forms based on templates:
- Fetches template using React Query
- Filters fields based on visibility, role restrictions, and conditional display
- Renders appropriate input component for each field type
- Supports multi-language labels
- Form validation error display
- Controlled component pattern with onChange callbacks

Supports all field types:
- text, textarea, number
- date, datetime
- select (with static options)
- radio (with static options)
- checkbox
- file upload

### 4. Custom Hooks

#### useFormTemplate (`src/hooks/use-form-template.ts`)

React Query hooks for form templates:
- `useFormTemplate(code, tenantId)` - Single template
- `useFormTemplates(tenantId)` - All templates

### 5. Permissions (`src/lib/permissions.ts`)

Utility functions for role-based access:
- `canManageForms(user)` - Check if user can manage forms
- `hasRole(user, roles)` - Check if user has specific role
- `getUserRoleCode(user)` - Get standardized role code

### 6. Settings Integration

Updated `src/features/settings/SettingsPage.tsx`:
- Added "Formlar" (Forms) tab in settings
- Tab only visible to Super Admin and Admin roles
- Links to dedicated forms management page

### 7. Routing

Added routes in `src/App.tsx`:
- `/settings/forms` - Form templates list
- `/settings/forms/:code` - Edit specific form template

## Features Implemented

### ✅ V1 Features

1. **Form Template Types System**
   - TypeScript types for all form structures
   - Multi-language support (TR/EN/FR/AR)
   - Role-based field visibility
   - Conditional field display (showIf)

2. **Mock Service Layer**
   - In-memory template storage
   - Global and tenant-specific templates
   - CRUD operations ready
   - Mock data for all 5 form types

3. **Form List Page**
   - View all available templates
   - See template metadata (version, scope, field count)
   - Navigate to edit page
   - Role-based access control

4. **Form Edit Page**
   - Visual field list with drag-to-reorder
   - Field visibility toggles
   - Required field toggles
   - Multi-language label editing
   - Real-time change detection
   - Save functionality with optimistic updates

5. **DynamicForm Component**
   - Template-driven form rendering
   - All field types supported
   - Role-based field filtering
   - Conditional field display
   - Error handling and validation display
   - Loading states

6. **Role-Based Access**
   - Only Super Admin and Admin can access
   - Menu items hidden for other roles
   - Page-level access control
   - Field-level role restrictions (onlyRoles)

## Mock Data

The service includes realistic mock templates for:

1. **Finance Transaction Form** (12 fields)
   - Type, date, amount, currency
   - Category, title, description
   - Vendor/customer, project, department
   - Payment method, attachments

2. **Project Form** (8 fields)
   - Code, name, description
   - Manager, dates, budget, category

3. **Qurban Donation Form** (7 fields)
   - Donor info, animal type
   - Share count, amount, location, notes

4. **HR Employee Form** (9 fields)
   - Personal info (name, email, phone)
   - Job info (department, position, hire date)
   - Salary (role-restricted), ID number

5. **HR Leave Request Form** (5 fields)
   - Leave type, dates, reason
   - Documents (conditional on sick leave)

## Usage Examples

### Using DynamicForm Component

```typescript
import { DynamicForm } from '@/components/forms/DynamicForm'
import { useState } from 'react'

function MyComponent() {
  const [formValues, setFormValues] = useState({})
  const [errors, setErrors] = useState({})

  const handleChange = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  return (
    <DynamicForm
      templateCode="finance.transaction"
      tenantId="IST01"
      locale="tr"
      values={formValues}
      onChange={handleChange}
      errors={errors}
      userRole="SUPER_ADMIN"
    />
  )
}
```

### Using Form Template Hook

```typescript
import { useFormTemplate } from '@/hooks/use-form-template'

function MyComponent() {
  const { data: template, isLoading } = useFormTemplate(
    'finance.transaction',
    'IST01'
  )

  if (isLoading) return <div>Loading...</div>
  
  return <div>{template?.name.tr}</div>
}
```

## Future Enhancements (TODO)

### Phase 2: Advanced Field Management
- [ ] Add new fields dynamically
- [ ] Delete fields
- [ ] Edit field types and keys
- [ ] Configure dynamic options (API-based select options)
- [ ] Advanced conditional logic builder

### Phase 3: Form Integration
- [ ] Replace hard-coded forms with DynamicForm
- [ ] Transaction form integration
- [ ] Project form integration
- [ ] HR forms integration
- [ ] Qurban forms integration

### Phase 4: Backend Integration
- [ ] Replace mock service with API calls
- [ ] Persist template changes to backend
- [ ] Version control and rollback
- [ ] Template import/export
- [ ] Audit trail for template changes

### Phase 5: Advanced Features
- [ ] Form preview mode
- [ ] Template cloning
- [ ] Global template override management
- [ ] Bulk field operations
- [ ] Custom validation rules
- [ ] Field dependencies and calculations
- [ ] Section/group support for complex forms
- [ ] Responsive field layouts

## Technical Notes

### State Management
- React Query for server state and caching
- Local state for form editing
- Zustand for auth state (existing)

### Performance
- Lazy loading of form pages
- Optimistic updates for better UX
- Efficient re-renders with proper memoization

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly

### Internationalization
- All UI text uses Turkish (primary language)
- Form labels support 4 languages (TR/EN/FR/AR)
- Easy to extend with more languages

## Files Created

```
src/
├── types/
│   └── forms.ts                          # Form type definitions
├── services/
│   └── formsService.ts                   # Form template service
├── features/
│   └── settings/
│       └── forms/
│           ├── FormsPage.tsx             # Form list page
│           └── FormEditPage.tsx          # Form edit page
├── components/
│   └── forms/
│       └── DynamicForm.tsx               # Dynamic form renderer
├── hooks/
│   └── use-form-template.ts              # Form template hooks
└── lib/
    └── permissions.ts                     # Permission utilities
```

## Files Modified

```
src/
├── App.tsx                               # Added form routes
└── features/
    └── settings/
        └── SettingsPage.tsx              # Added Forms tab
```

## Conclusion

The form management system is fully functional and ready to use. The infrastructure supports:
- Centralized form template management
- Multi-language support
- Role-based access control
- Dynamic form rendering
- Easy integration into existing features

The system is designed to be extended easily with backend integration and advanced features in future iterations.
