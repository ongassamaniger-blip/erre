import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import type {
  QurbanCampaign,
  QurbanDonation,
  QurbanSchedule,
  DistributionRecord,
} from '@/types'

// Excel Export Functions
export function exportCampaignsToExcel(campaigns: QurbanCampaign[]) {
  const ws_data = [
    [
      'Kampanya Adı',
      'Yıl',
      'Durum',
      'Hedef Tutar',
      'Toplanan Tutar',
      'Hedef Hayvan',
      'Tamamlanan Hayvan',
      'Başlangıç Tarihi',
      'Bitiş Tarihi',
      'Kesim Başlangıç',
      'Kesim Bitiş',
      'Para Birimi',
    ],
    ...campaigns.map((campaign) => [
      campaign.name,
      campaign.year,
      campaign.status,
      campaign.targetAmount,
      campaign.collectedAmount,
      campaign.targetAnimals,
      campaign.completedAnimals,
      format(new Date(campaign.startDate), 'dd/MM/yyyy'),
      format(new Date(campaign.endDate), 'dd/MM/yyyy'),
      format(new Date(campaign.slaughterStartDate), 'dd/MM/yyyy'),
      format(new Date(campaign.slaughterEndDate), 'dd/MM/yyyy'),
      campaign.currency,
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(ws_data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Kampanyalar')
  XLSX.writeFile(wb, `kurban_kampanyalari_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
}

export function exportDonationsToExcel(donations: QurbanDonation[]) {
  const qurbanTypeLabels: Record<string, string> = {
    sheep: 'Koyun',
    goat: 'Keçi',
    'cow-share': 'İnek Hissesi',
    'camel-share': 'Deve Hissesi',
  }

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Nakit',
    'bank-transfer': 'Banka Transferi',
    'credit-card': 'Kredi Kartı',
  }

  const ws_data = [
    [
      'Bağışçı Adı',
      'Telefon',
      'E-posta',
      'Ülke',
      'Kampanya',
      'Kurban Tipi',
      'Hisse Sayısı',
      'Tutar',
      'Para Birimi',
      'Ödeme Yöntemi',
      'Ödeme Durumu',
      'Dağıtım Bölgesi',
      'Durum',
      'Kayıt Tarihi',
    ],
    ...donations.map((donation) => [
      donation.donorName,
      donation.donorPhone || '',
      donation.donorEmail || '',
      donation.donorCountry,
      donation.campaignName,
      qurbanTypeLabels[donation.qurbanType] || donation.qurbanType,
      donation.shareCount,
      donation.amount,
      donation.currency,
      paymentMethodLabels[donation.paymentMethod] || donation.paymentMethod,
      donation.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede',
      donation.distributionRegion || '',
      donation.status,
      format(new Date(donation.createdDate), 'dd/MM/yyyy'),
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(ws_data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bağışlar')
  XLSX.writeFile(wb, `kurban_bagislari_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
}

export function exportSchedulesToExcel(schedules: QurbanSchedule[]) {
  const ws_data = [
    [
      'Tarih',
      'Başlangıç Saati',
      'Bitiş Saati',
      'Lokasyon',
      'Planlanan Sayı',
      'Tamamlanan Sayı',
      'Sorumlu',
      'Durum',
      'Notlar',
    ],
    ...schedules.map((schedule) => [
      format(new Date(schedule.date), 'dd/MM/yyyy'),
      schedule.startTime,
      schedule.endTime,
      schedule.location,
      schedule.plannedCount,
      schedule.completedCount,
      schedule.responsible,
      schedule.status,
      schedule.notes || '',
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(ws_data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Kesim Programı')
  XLSX.writeFile(wb, `kesim_programi_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
}

export function exportDistributionsToExcel(distributions: DistributionRecord[]) {
  const ws_data = [
    [
      'Tarih',
      'Kampanya',
      'Dağıtım Tipi',
      'Bölge',
      'Paket Sayısı',
      'Toplam Ağırlık (kg)',
      'Ortalama Ağırlık (kg/paket)',
      'Paket No / Alıcı',
      'Durum',
      'Teslim Alan',
      'Notlar',
    ],
    ...distributions.map((distribution) => [
      format(new Date(distribution.date), 'dd/MM/yyyy'),
      distribution.campaignName,
      distribution.distributionType === 'bulk' ? 'Toplu' : 'Kişisel',
      distribution.region,
      distribution.distributionType === 'bulk' 
        ? (distribution.packageCount || 0).toString()
        : (distribution.packageNumber || '-'),
      distribution.distributionType === 'bulk'
        ? (distribution.totalWeight || 0).toFixed(1)
        : (distribution.weight || 0).toFixed(1),
      distribution.distributionType === 'bulk' && distribution.averageWeightPerPackage
        ? distribution.averageWeightPerPackage.toFixed(2)
        : '-',
      distribution.distributionType === 'bulk'
        ? '-'
        : `${distribution.recipientName || ''} ${distribution.recipientCode ? `(${distribution.recipientCode})` : ''}`,
      distribution.status === 'delivered' ? 'Teslim Edildi' : 'Beklemede',
      distribution.receivedBy || '',
      distribution.notes || '',
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(ws_data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dağıtım Kayıtları')
  XLSX.writeFile(wb, `et_dagitim_kayitlari_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
}

// PDF Export Functions
export function exportCampaignToPDF(campaign: QurbanCampaign, donations: QurbanDonation[] = []) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('KURBAN KAMPANYASI RAPORU', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(campaign.name, pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // Campaign Info
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Kampanya Bilgileri', margin, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const campaignInfo = [
    ['Yıl:', campaign.year.toString()],
    ['Durum:', campaign.status],
    ['Hedef Tutar:', `${campaign.targetAmount.toLocaleString('tr-TR')} ${campaign.currency}`],
    ['Toplanan Tutar:', `${campaign.collectedAmount.toLocaleString('tr-TR')} ${campaign.currency}`],
    ['Hedef Hayvan:', campaign.targetAnimals.toString()],
    ['Tamamlanan Hayvan:', campaign.completedAnimals.toString()],
    [
      'Kampanya Süresi:',
      `${format(new Date(campaign.startDate), 'dd/MM/yyyy', { locale: tr })} - ${format(new Date(campaign.endDate), 'dd/MM/yyyy', { locale: tr })}`,
    ],
    [
      'Kesim Tarihleri:',
      `${format(new Date(campaign.slaughterStartDate), 'dd/MM/yyyy', { locale: tr })} - ${format(new Date(campaign.slaughterEndDate), 'dd/MM/yyyy', { locale: tr })}`,
    ],
  ]

  campaignInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, margin + 50, yPos)
    yPos += 6
  })

  yPos += 5

  // Donations Table
  if (donations.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Bağış Listesi', margin, yPos)
    yPos += 8

    const tableData = donations.map((donation) => [
      donation.donorName,
      donation.amount.toLocaleString('tr-TR'),
      donation.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede',
      format(new Date(donation.createdDate), 'dd/MM/yyyy'),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Bağışçı', 'Tutar', 'Ödeme Durumu', 'Tarih']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      margin: { left: margin, right: margin },
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Sayfa ${i} / ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    )
    doc.text(
      `Oluşturulma: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: tr })}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    )
  }

  doc.save(`kurban_kampanya_${campaign.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`)
}

export function exportDonationToPDF(donation: QurbanDonation) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('KURBAN BAĞIŞ KAYDI', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // Donor Info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Bağışçı Bilgileri', margin, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const donorInfo = [
    ['Ad Soyad:', donation.donorName],
    ['Telefon:', donation.donorPhone || '-'],
    ['E-posta:', donation.donorEmail || '-'],
    ['Ülke:', donation.donorCountry],
  ]

  donorInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, margin + 50, yPos)
    yPos += 6
  })

  yPos += 5

  // Donation Info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Bağış Bilgileri', margin, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const donationInfo = [
    ['Kampanya:', donation.campaignName],
    ['Kurban Tipi:', donation.qurbanType],
    ['Hisse Sayısı:', donation.shareCount.toString()],
    ['Tutar:', `${donation.amount.toLocaleString('tr-TR')} ${donation.currency}`],
    ['Ödeme Yöntemi:', donation.paymentMethod],
    ['Ödeme Durumu:', donation.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede'],
    ['Dağıtım Bölgesi:', donation.distributionRegion || '-'],
    ['Kayıt Tarihi:', format(new Date(donation.createdDate), 'dd/MM/yyyy', { locale: tr })],
  ]

  donationInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, margin + 50, yPos)
    yPos += 6
  })

  // Footer
  doc.setFontSize(8)
  doc.text(
    `Oluşturulma: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: tr })}`,
    margin,
    doc.internal.pageSize.getHeight() - 10
  )

  doc.save(`kurban_bagis_${donation.donorName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`)
}

// Print Functions
export function printCampaign(campaign: QurbanCampaign, donations: QurbanDonation[] = []) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kurban Kampanyası Raporu - ${campaign.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #333; }
        h2 { color: #555; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4285f4; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 150px; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>KURBAN KAMPANYASI RAPORU</h1>
      <h2>${campaign.name}</h2>
      
      <div class="info-row"><span class="label">Yıl:</span> ${campaign.year}</div>
      <div class="info-row"><span class="label">Durum:</span> ${campaign.status}</div>
      <div class="info-row"><span class="label">Hedef Tutar:</span> ${campaign.targetAmount.toLocaleString('tr-TR')} ${campaign.currency}</div>
      <div class="info-row"><span class="label">Toplanan Tutar:</span> ${campaign.collectedAmount.toLocaleString('tr-TR')} ${campaign.currency}</div>
      <div class="info-row"><span class="label">Hedef Hayvan:</span> ${campaign.targetAnimals}</div>
      <div class="info-row"><span class="label">Tamamlanan Hayvan:</span> ${campaign.completedAnimals}</div>
      <div class="info-row"><span class="label">Kampanya Süresi:</span> ${format(new Date(campaign.startDate), 'dd/MM/yyyy', { locale: tr })} - ${format(new Date(campaign.endDate), 'dd/MM/yyyy', { locale: tr })}</div>
      <div class="info-row"><span class="label">Kesim Tarihleri:</span> ${format(new Date(campaign.slaughterStartDate), 'dd/MM/yyyy', { locale: tr })} - ${format(new Date(campaign.slaughterEndDate), 'dd/MM/yyyy', { locale: tr })}</div>
      
      ${donations.length > 0 ? `
        <h2>Bağış Listesi</h2>
        <table>
          <thead>
            <tr>
              <th>Bağışçı</th>
              <th>Tutar</th>
              <th>Ödeme Durumu</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            ${donations.map(d => `
              <tr>
                <td>${d.donorName}</td>
                <td>${d.amount.toLocaleString('tr-TR')} ${d.currency}</td>
                <td>${d.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede'}</td>
                <td>${format(new Date(d.createdDate), 'dd/MM/yyyy', { locale: tr })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      <div style="margin-top: 30px; font-size: 12px; color: #666;">
        Oluşturulma: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: tr })}
      </div>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

export function printDonation(donation: QurbanDonation) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kurban Bağış Kaydı - ${donation.donorName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #333; }
        h2 { color: #555; border-bottom: 2px solid #ddd; padding-bottom: 5px; margin-top: 20px; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 150px; }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <h1>KURBAN BAĞIŞ KAYDI</h1>
      
      <h2>Bağışçı Bilgileri</h2>
      <div class="info-row"><span class="label">Ad Soyad:</span> ${donation.donorName}</div>
      <div class="info-row"><span class="label">Telefon:</span> ${donation.donorPhone || '-'}</div>
      <div class="info-row"><span class="label">E-posta:</span> ${donation.donorEmail || '-'}</div>
      <div class="info-row"><span class="label">Ülke:</span> ${donation.donorCountry}</div>
      
      <h2>Bağış Bilgileri</h2>
      <div class="info-row"><span class="label">Kampanya:</span> ${donation.campaignName}</div>
      <div class="info-row"><span class="label">Kurban Tipi:</span> ${donation.qurbanType}</div>
      <div class="info-row"><span class="label">Hisse Sayısı:</span> ${donation.shareCount}</div>
      <div class="info-row"><span class="label">Tutar:</span> ${donation.amount.toLocaleString('tr-TR')} ${donation.currency}</div>
      <div class="info-row"><span class="label">Ödeme Yöntemi:</span> ${donation.paymentMethod}</div>
      <div class="info-row"><span class="label">Ödeme Durumu:</span> ${donation.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede'}</div>
      <div class="info-row"><span class="label">Dağıtım Bölgesi:</span> ${donation.distributionRegion || '-'}</div>
      <div class="info-row"><span class="label">Kayıt Tarihi:</span> ${format(new Date(donation.createdDate), 'dd/MM/yyyy', { locale: tr })}</div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #666;">
        Oluşturulma: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: tr })}
      </div>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

