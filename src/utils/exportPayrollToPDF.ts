import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { printTemplatesService } from '@/services/printTemplates/printTemplatesService'
import type { PayrollRecord } from '@/services/payrollService'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

  // Ensure html2canvas is available for jsPDF
  ; (window as any).html2canvas = html2canvas

export async function exportPayrollToPDF(payroll: PayrollRecord) {
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

    const doc = new jsPDF({
      orientation: template.pageOrientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: payroll.currency,
        minimumFractionDigits: 0,
      }).format(amount)
    }

    // HTML Content Generation (Similar to printPayroll but for PDF)
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
            value = `Çalışan: ${payroll.employeeName}`
            break
          case 'employeeCode':
            value = `Kod: ${payroll.employeeCode}`
            break
          case 'period':
            value = `Dönem: ${format(new Date(payroll.period + '-01'), 'MMMM yyyy', { locale: tr })}`
            break
          case 'printDate':
            value = `Tarih: ${format(new Date(), 'dd.MM.yyyy', { locale: tr })}`
            break
        }
        const align = field.align || 'left'
        const fontWeight = field.bold ? 'bold' : 'normal'
        const fontSize = field.bold ? '14px' : '12px'
        return `<div style="text-align: ${align}; font-weight: ${fontWeight}; font-size: ${fontSize}; margin-bottom: 5px;">${value}</div>`
      })
      .join('')

    const bodyHTML = `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10px;">
        <tr style="background-color: #f0f0f0;">
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
        <tr style="background-color: #f9f9f9;">
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
        <tr style="background-color: #e6ffe6;">
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; font-size: 1.2em;">Net Maaş</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 1.2em; color: green;">${formatCurrency(payroll.netSalary)}</td>
        </tr>
      </table>
    `

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
              ? `Ödeme Tarihi: ${format(new Date(payroll.paymentDate), 'dd.MM.yyyy', { locale: tr })}`
              : ''
            break
        }
        const align = field.align || 'left'
        return `<div style="text-align: ${align}; font-size: 10px; color: #666; margin-top: 5px;">${value}</div>`
      })
      .join('')

    const signatureHTML = template.signatureFields
      .filter(f => f.visible)
      .sort((a, b) => a.order - b.order)
      .map(field => {
        let value = ''
        switch (field.key) {
          case 'employeeSignature':
            value = payroll.signedByEmployee
              ? `${payroll.signedBy || payroll.employeeName}<br/>${payroll.signedDate ? format(new Date(payroll.signedDate), 'dd.MM.yyyy', { locale: tr }) : ''}`
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
        return `<div style="text-align: ${align}; margin-top: 40px; font-size: 10px; width: 30%;">${value}</div>`
      })
      .join('')

    // Create a temporary container
    const container = document.createElement('div')
    container.style.width = '210mm' // A4 width
    container.style.padding = '20mm'
    container.style.fontFamily = 'Arial, sans-serif' // Use standard font that supports TR characters
    container.style.fontSize = '12px'
    container.style.backgroundColor = 'white'
    container.style.color = 'black'

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100%;">
        ${template.showLogo ? `<div style="margin-bottom: 20px; text-align: ${template.logoPosition};"><div style="width: 50px; height: 50px; background: #eee;"></div></div>` : ''}
        <div style="margin-bottom: 20px;">${headerHTML}</div>
        <div>${bodyHTML}</div>
        <div style="margin-top: 20px;">${footerHTML}</div>
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">${signatureHTML}</div>
        ${template.showPageNumber ? '<div style="text-align: center; margin-top: auto; font-size: 9px; color: #999;">Sayfa 1</div>' : ''}
      </div>
    `

    document.body.appendChild(container)

    await doc.html(container, {
      callback: (doc) => {
        const periodLabel = format(new Date(payroll.period + '-01'), 'MMMM-yyyy', { locale: tr })
        const employeeNameSlug = payroll.employeeName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
        const filename = `bordro-${periodLabel}-${employeeNameSlug}.pdf`
        doc.save(filename)
        document.body.removeChild(container)
      },
      x: 0,
      y: 0,
      width: 210, // target width in the PDF document
      windowWidth: 800 // window width in CSS pixels
    })

  } catch (error) {
    console.error('PDF export error:', error)
    throw error
  }
}

