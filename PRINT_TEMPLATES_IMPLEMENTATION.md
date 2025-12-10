# Print Templates System Implementation

## Overview
Created a comprehensive print templates management system that is completely independent from the form management system. This allows administrators to customize the layout and appearance of PDF/print outputs across the application.

## Files Created

### 1. Type Definitions
**File:** `src/types/printTemplates.ts`
- `PrintTemplateCode`: Enum-like type for all print template types (finance.transaction, hr.payslip, qurban.certificate, etc.)
- `PrintSectionType`: Defines sections (header, body, footer, signatures)
- `PrintField`: Individual field configuration with visibility, styling, alignment options
- `PrintTemplate`: Complete template definition with all sections and general settings

### 2. Service Layer
**File:** `src/services/printTemplates/printTemplatesService.ts`
- Mock service with in-memory storage
- `getPrintTemplates()`: Returns all templates for a tenant
- `getPrintTemplateByCode()`: Gets specific template with tenant override support
- `updatePrintTemplate()`: Saves template changes
- `createTenantOverride()`: Creates tenant-specific override of global template

**Mock Data Included:**
- Finance Transaction Document
- HR Payslip
- Qurban Certificate
- Finance Budget Report

### 3. UI Components

**File:** `src/features/settings/print-templates/PrintTemplatesPage.tsx`
- List view of all print templates
- Table showing template name, code, scope, orientation, logo settings
- Last updated timestamp
- Edit button for each template
- Role-based access control (Super Admin / Admin only)

**File:** `src/features/settings/print-templates/PrintTemplateEditPage.tsx`
- Full template editor with drag & drop field reordering
- Tab-based interface for different sections:
  - Header Fields
  - Body Fields (table columns)
  - Footer Fields
  - Signature Fields
  - General Settings

**Field Editor Features:**
- Toggle field visibility
- Set text alignment (left/center/right)
- Apply bold/italic styling
- Set column widths (for body fields)
- Drag & drop to reorder fields

**General Settings:**
- Page orientation (portrait/landscape)
- Logo visibility and position
- Page numbering

### 4. Routing & Navigation
**Updated Files:**
- `src/App.tsx`: Added routes for print templates
  - `/settings/print-templates` → List page
  - `/settings/print-templates/:code` → Edit page
- `src/features/settings/SettingsPage.tsx`: Added "Yazdırma" tab in settings

## Key Features

### 1. Independent from Forms
- Completely separate type definitions
- Separate service layer
- Different purpose: Forms handle data entry, Print Templates handle output design

### 2. Template Scoping
- **GLOBAL**: Default templates available to all tenants
- **TENANT**: Facility-specific overrides

### 3. Field Management
Each field can be configured with:
- Label (multilingual support: tr, en, fr, ar)
- Visibility toggle
- Text alignment
- Font styling (bold, italic)
- Column width (for table columns in body section)
- Custom ordering via drag & drop

### 4. Role-Based Access
- Only **Super Admin** and **Admin** roles can access
- Guards implemented at both route and component level
- Redirects unauthorized users with error message

### 5. Sections
Templates are organized into 4 sections:
- **Header**: Organization name, document title, print date, etc.
- **Body**: Main content (typically table columns with data)
- **Footer**: Legal notices, contact information
- **Signatures**: Approval/authorization signature blocks

## Usage

### Accessing Print Templates
1. Navigate to Settings (gear icon in sidebar)
2. Click on "Yazdırma" tab
3. Click "Yazdırma Şablonlarına Git" button
4. View list of all available templates

### Editing a Template
1. Click "Düzenle" button on any template
2. Use tabs to navigate between sections
3. Toggle visibility, adjust styling, reorder fields via drag & drop
4. Configure general settings (orientation, logo, page numbers)
5. Click "Kaydet" to save changes

## Next Steps (Not Implemented Yet)

### 1. Connect Print Buttons
Find all print buttons in the system and connect them to appropriate templates:
- Finance transaction detail page → `'finance.transaction'` template
- Finance budget reports → `'finance.budget'` template
- HR payslip generation → `'hr.payslip'` template
- Qurban certificates → `'qurban.certificate'` template

Example handler:
```typescript
const handlePrint = async () => {
  const template = await printTemplatesService.getPrintTemplateByCode(
    'finance.transaction',
    currentTenantId
  )
  // TODO: Generate actual PDF/print output using template configuration
  console.log('Print template:', template)
  window.print() // Temporary - replace with proper PDF generation
}
```

### 2. PDF Generation
Implement actual PDF generation using a library like:
- `jsPDF`
- `pdfmake`
- `react-pdf`

The template configuration should drive the PDF layout:
- Use `headerFields` for document header
- Use `bodyFields` for table structure
- Use `footerFields` for footer content
- Use `signatureFields` for signature blocks
- Apply styling based on `bold`, `italic`, `align` properties
- Respect `pageOrientation`, `showLogo`, `showPageNumber` settings

### 3. Backend Integration
Replace mock service with real API calls:
```typescript
export const printTemplatesService = {
  async getPrintTemplates(tenantId: string): Promise<PrintTemplate[]> {
    const response = await fetch(`/api/print-templates?tenantId=${tenantId}`)
    return response.json()
  },
  
  async getPrintTemplateByCode(code: PrintTemplateCode, tenantId: string): Promise<PrintTemplate> {
    const response = await fetch(`/api/print-templates/${code}?tenantId=${tenantId}`)
    return response.json()
  },
  
  async updatePrintTemplate(template: PrintTemplate): Promise<PrintTemplate> {
    const response = await fetch(`/api/print-templates/${template.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    })
    return response.json()
  }
}
```

### 4. Additional Features
- Preview functionality before saving
- Export/import templates
- Template versioning and rollback
- Duplicate template functionality
- Delete tenant overrides (restore to global)
- Print preview modal
- Batch print operations

## Design Principles

1. **Separation of Concerns**: Print templates are completely separate from form templates
2. **Flexibility**: Support both global defaults and tenant-specific customization
3. **User-Friendly**: Drag & drop interface for easy field management
4. **Multilingual**: All labels support multiple languages
5. **Role Security**: Restricted to authorized administrators only
6. **Extensibility**: Easy to add new template types and fields

## Technical Notes

- Uses Zustand for auth state management
- Leverages shadcn/ui components for consistent UI
- TypeScript for type safety
- React Hook Form patterns for form management
- Framer Motion for smooth drag & drop animations
- date-fns for date formatting
- Sonner for toast notifications
