import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ApprovalRequest } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export function exportApprovalsToExcel(approvals: ApprovalRequest[]): void {
  const ws_data = [
    [
      'ID',
      'Modül',
      'Tip',
      'Başlık',
      'Açıklama',
      'Tutar',
      'Para Birimi',
      'Talep Eden',
      'Talep Tarihi',
      'Durum',
      'Öncelik',
      'Son Tarih',
      'Onaylayıcı',
      'Şube',
    ],
    ...approvals.map((approval) => [
      approval.id,
      approval.module === 'finance' ? 'Finans' : approval.module === 'hr' ? 'İK' : approval.module === 'projects' ? 'Proje' : 'Kurban',
      approval.type,
      approval.title,
      approval.description,
      approval.amount || 0,
      approval.currency || 'TRY',
      approval.requestedBy.name,
      format(new Date(approval.requestedAt), 'dd/MM/yyyy HH:mm', { locale: tr }),
      approval.status === 'pending' ? 'Beklemede' : approval.status === 'approved' ? 'Onaylandı' : approval.status === 'rejected' ? 'Reddedildi' : 'İptal',
      approval.priority === 'urgent' ? 'Acil' : approval.priority === 'high' ? 'Yüksek' : approval.priority === 'medium' ? 'Orta' : 'Düşük',
      approval.deadline ? format(new Date(approval.deadline), 'dd/MM/yyyy HH:mm', { locale: tr }) : '-',
      approval.currentApprover?.name || '-',
      approval.facilityId || '-',
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(ws_data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Onaylar')
  XLSX.writeFile(wb, `onaylar_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
}

export function exportApprovalToPDF(approval: ApprovalRequest): void {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Başlık
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Onay Detay Raporu', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // Temel Bilgiler
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Temel Bilgiler', 14, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const basicInfo = [
    ['Başlık:', approval.title],
    ['Açıklama:', approval.description],
    ['Modül:', approval.module === 'finance' ? 'Finans' : approval.module === 'hr' ? 'İK' : approval.module === 'projects' ? 'Proje' : 'Kurban'],
    ['Tip:', approval.type],
    ['Durum:', approval.status === 'pending' ? 'Beklemede' : approval.status === 'approved' ? 'Onaylandı' : approval.status === 'rejected' ? 'Reddedildi' : 'İptal'],
    ['Öncelik:', approval.priority === 'urgent' ? 'Acil' : approval.priority === 'high' ? 'Yüksek' : approval.priority === 'medium' ? 'Orta' : 'Düşük'],
  ]

  basicInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 14, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), 60, yPos)
    yPos += 6
  })

  if (approval.amount) {
    doc.setFont('helvetica', 'bold')
    doc.text('Tutar:', 14, yPos)
    doc.setFont('helvetica', 'normal')
    const amount = new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: approval.currency || 'TRY',
      minimumFractionDigits: 0,
    }).format(approval.amount)
    doc.text(amount, 60, yPos)
    yPos += 6
  }

  yPos += 5

  // Talep Eden
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Talep Eden', 14, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Ad: ${approval.requestedBy.name}`, 14, yPos)
  yPos += 6
  doc.text(`Tarih: ${format(new Date(approval.requestedAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}`, 14, yPos)
  yPos += 10

  // Onaylayıcı
  if (approval.currentApprover) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Onaylayıcı', 14, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Ad: ${approval.currentApprover.name}`, 14, yPos)
    yPos += 6
    doc.text(`Rol: ${approval.currentApprover.role}`, 14, yPos)
    yPos += 10
  }

  // İşlem Geçmişi
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('İşlem Geçmişi', 14, yPos)
  yPos += 8

  const historyData = approval.history.map((item) => [
    item.action === 'submitted' ? 'Talep Oluşturuldu' : item.action === 'approved' ? 'Onaylandı' : 'Reddedildi',
    item.actor.name,
    format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm', { locale: tr }),
    item.comment || '-',
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['İşlem', 'Kullanıcı', 'Tarih', 'Yorum']],
    body: historyData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  })

  // Dosya adı
  const fileName = `onay-${approval.id}-${format(new Date(), 'yyyyMMdd')}.pdf`
  doc.save(fileName)
}

export function printApproval(approval: ApprovalRequest): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    return
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Onay Detay - ${approval.title}</title>
        <style>
          @media print {
            @page {
              size: A4;
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
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2563eb;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            width: 150px;
          }
          .info-value {
            flex: 1;
          }
          .history-item {
            border-left: 3px solid #2563eb;
            padding-left: 10px;
            margin-bottom: 15px;
          }
          .history-action {
            font-weight: bold;
            color: #2563eb;
          }
          .history-comment {
            font-style: italic;
            color: #666;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Onay Detay Raporu</h1>
          <p><strong>ID:</strong> ${approval.id}</p>
        </div>

        <div class="section">
          <div class="section-title">Temel Bilgiler</div>
          <div class="info-row">
            <div class="info-label">Başlık:</div>
            <div class="info-value">${approval.title}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Açıklama:</div>
            <div class="info-value">${approval.description}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Modül:</div>
            <div class="info-value">${approval.module === 'finance' ? 'Finans' : approval.module === 'hr' ? 'İK' : approval.module === 'projects' ? 'Proje' : 'Kurban'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Tip:</div>
            <div class="info-value">${approval.type}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Durum:</div>
            <div class="info-value">${approval.status === 'pending' ? 'Beklemede' : approval.status === 'approved' ? 'Onaylandı' : approval.status === 'rejected' ? 'Reddedildi' : 'İptal'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Öncelik:</div>
            <div class="info-value">${approval.priority === 'urgent' ? 'Acil' : approval.priority === 'high' ? 'Yüksek' : approval.priority === 'medium' ? 'Orta' : 'Düşük'}</div>
          </div>
          ${approval.amount ? `
          <div class="info-row">
            <div class="info-label">Tutar:</div>
            <div class="info-value">${formatCurrency(approval.amount, approval.currency || 'TRY')}</div>
          </div>
          ` : ''}
          ${approval.deadline ? `
          <div class="info-row">
            <div class="info-label">Son Tarih:</div>
            <div class="info-value">${format(new Date(approval.deadline), 'dd MMMM yyyy, HH:mm', { locale: tr })}</div>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Talep Eden</div>
          <div class="info-row">
            <div class="info-label">Ad:</div>
            <div class="info-value">${approval.requestedBy.name}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Tarih:</div>
            <div class="info-value">${format(new Date(approval.requestedAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}</div>
          </div>
        </div>

        ${approval.currentApprover ? `
        <div class="section">
          <div class="section-title">Onaylayıcı</div>
          <div class="info-row">
            <div class="info-label">Ad:</div>
            <div class="info-value">${approval.currentApprover.name}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Rol:</div>
            <div class="info-value">${approval.currentApprover.role}</div>
          </div>
        </div>
        ` : ''}

        ${Object.keys(approval.metadata).length > 0 ? `
        <div class="section">
          <div class="section-title">Detay Bilgileri</div>
          <table>
            <thead>
              <tr>
                <th>Alan</th>
                <th>Değer</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(approval.metadata).map(([key, value]) => `
                <tr>
                  <td>${key.replace(/([A-Z])/g, ' $1').trim()}</td>
                  <td>${Array.isArray(value) ? value.join(', ') : String(value)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">İşlem Geçmişi</div>
          ${approval.history.map((item) => `
            <div class="history-item">
              <div class="history-action">
                ${item.action === 'submitted' ? 'Talep Oluşturuldu' : item.action === 'approved' ? 'Onaylandı' : 'Reddedildi'}
              </div>
              <div>Kullanıcı: ${item.actor.name}</div>
              <div>Tarih: ${format(new Date(item.timestamp), 'dd MMMM yyyy, HH:mm', { locale: tr })}</div>
              ${item.comment ? `<div class="history-comment">Yorum: "${item.comment}"</div>` : ''}
            </div>
          `).join('')}
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

