import { printTemplatesService } from '@/services/printTemplates/printTemplatesService'
import type { PayrollRecord } from '@/services/payrollService'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export async function printPayroll(payroll: PayrollRecord) {
  const authStore = useAuthStore.getState()
  const selectedFacility = authStore.selectedFacility
  
  if (!selectedFacility?.id) {
    throw new Error('Facility not selected')
  }

  try {
    // Template'i al
    const template = await printTemplatesService.getPrintTemplateByCode(
      'hr.payslip',
      selectedFacility.id
    )

    // Print için HTML oluştur
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Popup blocked')
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: payroll.currency,
        minimumFractionDigits: 0,
      }).format(amount)
    }

    // Header fields
    const headerHTML = template.headerFields
      .filter(f => f.visible)
      .sort((a, b) => a.order - b.order)
      .map(field => {
        let value = ''
        switch (field.key) {
          case 'organizationName':
            value = selectedFacility.name || 'Kurum Adı'
            break
          case 'documentTitle':
            value = 'MAAŞ BORDROSU'
            break
          case 'employeeName':
            value = payroll.employeeName
            break
          case 'employeeCode':
            value = payroll.employeeCode
            break
          case 'period':
            value = format(new Date(payroll.period + '-01'), 'MMMM yyyy', { locale: tr })
            break
          case 'printDate':
            value = format(new Date(), 'dd.MM.yyyy', { locale: tr })
            break
        }
        const align = field.align || 'left'
        const bold = field.bold ? 'font-weight: bold;' : ''
        return `<div style="text-align: ${align}; ${bold}">${value}</div>`
      })
      .join('')

    // Body fields (bordro detayları)
    const bodyHTML = `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Açıklama</td>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; text-align: right;">Tutar</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Temel Maaş</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(payroll.baseSalary)}</td>
        </tr>
        ${payroll.allowances.map(a => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${a.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: green;">+${formatCurrency(a.amount)}</td>
          </tr>
        `).join('')}
        ${payroll.bonuses.map(b => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${b.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: green;">+${formatCurrency(b.amount)}</td>
          </tr>
        `).join('')}
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Brüt Maaş</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(payroll.grossSalary)}</td>
        </tr>
        ${payroll.deductions.map(d => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${d.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: red;">-${formatCurrency(d.amount)}</td>
          </tr>
        `).join('')}
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Toplam Kesinti</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: red;">-${formatCurrency(payroll.totalDeductions)}</td>
        </tr>
        <tr style="background-color: #f0f0f0;">
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; font-size: 1.1em;">Net Maaş</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 1.1em; color: green;">${formatCurrency(payroll.netSalary)}</td>
        </tr>
      </table>
    `

    // Footer fields
    const footerHTML = template.footerFields
      .filter(f => f.visible)
      .sort((a, b) => a.order - b.order)
      .map(field => {
        let value = ''
        switch (field.key) {
          case 'notes':
            value = payroll.notes || ''
            break
          case 'paymentDate':
            value = payroll.paymentDate 
              ? format(new Date(payroll.paymentDate), 'dd.MM.yyyy', { locale: tr })
              : ''
            break
        }
        const align = field.align || 'left'
        return `<div style="text-align: ${align}">${value}</div>`
      })
      .join('')

    // Signature fields
    const signatureHTML = template.signatureFields
      .filter(f => f.visible)
      .sort((a, b) => a.order - b.order)
      .map(field => {
        let value = ''
        switch (field.key) {
          case 'employeeSignature':
            value = payroll.signedByEmployee 
              ? `${payroll.signedBy || payroll.employeeName} - ${payroll.signedDate ? format(new Date(payroll.signedDate), 'dd.MM.yyyy', { locale: tr }) : ''}`
              : 'İmza: _______________'
            break
          case 'preparedBy':
            value = 'Hazırlayan: _______________'
            break
          case 'approvedBy':
            value = 'Onaylayan: _______________'
            break
        }
        const align = field.align || 'left'
        return `<div style="text-align: ${align}; margin-top: 40px;">${value}</div>`
      })
      .join('')

    // Logo (eğer gösterilecekse)
    const logoHTML = template.showLogo 
      ? `<div style="text-align: ${template.logoPosition}; margin-bottom: 20px;">
           <div style="width: 100px; height: 100px; background-color: #f0f0f0; border: 1px solid #ddd; display: inline-block;"></div>
         </div>`
      : ''

    // Sayfa numarası
    const pageNumberHTML = template.showPageNumber
      ? '<div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">Sayfa 1</div>'
      : ''

    // Tam HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Bordro - ${payroll.employeeName}</title>
          <style>
            @media print {
              @page {
                size: ${template.pageOrientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
                margin: 2cm;
              }
              body {
                margin: 0;
                padding: 20px;
              }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.6;
              color: #333;
            }
            .header {
              margin-bottom: 30px;
            }
            .footer {
              margin-top: 30px;
              font-size: 11px;
              color: #666;
            }
            .signatures {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 8px;
              border: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          ${logoHTML}
          <div class="header">
            ${headerHTML}
          </div>
          <div class="body">
            ${bodyHTML}
          </div>
          ${payroll.notes ? `<div class="footer">${footerHTML}</div>` : ''}
          <div class="signatures">
            ${signatureHTML}
          </div>
          ${pageNumberHTML}
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    
    // Yazdırmayı tetikle
    setTimeout(() => {
      printWindow.print()
    }, 250)
  } catch (error) {
    console.error('Print error:', error)
    throw error
  }
}

