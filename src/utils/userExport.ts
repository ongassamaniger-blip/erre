import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { BranchUser } from '@/types/branchUserManagement'

export function exportUserToPDF(user: BranchUser, filename?: string): void {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(`Kullanıcı Detay Raporu: ${user.name}`, 14, 22)

  doc.setFontSize(12)
  let y = 30

  const addField = (label: string, value: string) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 50, y)
    y += 7
  }

  addField('E-posta', user.email)
  addField('Rol', user.role)
  if (user.department) addField('Departman', user.department)
  if (user.position) addField('Pozisyon', user.position)
  if (user.phone) addField('Telefon', user.phone)
  addField('Durum', user.isActive ? 'Aktif' : 'Pasif')
  addField('Oluşturulma', format(new Date(user.createdAt), 'dd.MM.yyyy', { locale: tr }))
  if (user.lastLogin) {
    addField('Son Giriş', format(new Date(user.lastLogin), 'dd.MM.yyyy HH:mm', { locale: tr }))
  }

  y += 10
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('İzinler', 14, y)
  y += 7

  const permissionRows: string[][] = []
  Object.entries(user.permissions).forEach(([module, perms]) => {
    const activePerms = Object.entries(perms)
      .filter(([_, value]) => value === true)
      .map(([perm]) => {
        const permMap: Record<string, string> = {
          view: 'Görüntüle',
          create: 'Oluştur',
          edit: 'Düzenle',
          delete: 'Sil',
          approve: 'Onayla',
          reject: 'Reddet',
          export: 'Dışa Aktar',
        }
        return permMap[perm] || perm
      })
      .join(', ')

    if (activePerms) {
      permissionRows.push([
        module.charAt(0).toUpperCase() + module.slice(1),
        activePerms,
      ])
    }
  })

  if (permissionRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Modül', 'İzinler']],
      body: permissionRows,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
      margin: { left: 14, right: 14 },
    })
  } else {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Aktif izin bulunmamaktadır.', 14, y)
  }

  doc.save(filename || `kullanici_${user.id}.pdf`)
}

import * as XLSX from 'xlsx'

export function exportUsersToExcel(users: BranchUser[], filename: string = 'kullanicilar.xlsx'): void {
  const data = users.map(user => ({
    'İsim': user.name,
    'E-posta': user.email,
    'Rol': user.role,
    'Departman': user.department || '-',
    'Pozisyon': user.position || '-',
    'Telefon': user.phone || '-',
    'Durum': user.isActive ? 'Aktif' : 'Pasif',
    'Oluşturulma': format(new Date(user.createdAt), 'dd.MM.yyyy', { locale: tr }),
    'Son Giriş': user.lastLogin ? format(new Date(user.lastLogin), 'dd.MM.yyyy HH:mm', { locale: tr }) : '-',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Kullanıcılar')
  XLSX.writeFile(wb, filename)
}

export function exportHierarchyToPDF(
  hierarchy: any[],
  users: BranchUser[],
  facilityName?: string
): void {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(`Organizasyon Hiyerarşisi${facilityName ? ` - ${facilityName}` : ''}`, 14, 22)

  doc.setFontSize(12)
  let y = 30

  const renderNode = (node: any, level: number = 0) => {
    const user = users.find(u => u.id === node.userId)
    const indent = level * 15

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('•', 14 + indent, y)
    doc.setFont('helvetica', 'normal')
    doc.text(`${node.userName} (${node.role})`, 20 + indent, y)
    y += 7

    if (y > 280) {
      doc.addPage()
      y = 20
    }

    node.subordinates.forEach((sub: any) => renderNode(sub, level + 1))
  }

  hierarchy.forEach(node => renderNode(node, 0))

  doc.save(`hiyerarsi_${facilityName || 'sube'}.pdf`)
}

