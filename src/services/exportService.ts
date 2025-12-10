import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface ExportOptions {
    filename: string
    title: string
    facilityName?: string
    userName?: string
    dateRange?: { start: Date; end: Date }
}

interface ExcelColumn {
    header: string
    key: string
    width?: number
    format?: 'currency' | 'date' | 'number' | 'string'
}

export const exportService = {
    /**
     * Export data to a professionally formatted Excel file
     */
    toExcel: <T>(data: T[], columns: ExcelColumn[], options: ExportOptions) => {
        const wb = XLSX.utils.book_new()
        const wsData: any[][] = []

        // 1. Add Metadata Header (Letterhead style)
        wsData.push([options.facilityName || 'NGO Yönetim Sistemi']) // Row 1: Facility Name
        wsData.push([options.title.toUpperCase()]) // Row 2: Report Title
        wsData.push([`Oluşturulma Tarihi: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })}`]) // Row 3: Date

        if (options.dateRange) {
            wsData.push([`Dönem: ${format(options.dateRange.start, 'dd.MM.yyyy')} - ${format(options.dateRange.end, 'dd.MM.yyyy')}`])
        }

        if (options.userName) {
            wsData.push([`Oluşturan: ${options.userName}`])
        }

        wsData.push(['']) // Empty row for spacing

        // 2. Add Table Headers
        const headers = columns.map(c => c.header)
        wsData.push(headers)

        // 3. Add Data
        data.forEach(item => {
            const row = columns.map(col => {
                const val = (item as any)[col.key]

                // Format values based on type
                if (val === null || val === undefined) return '-'

                if (col.format === 'currency') {
                    // Return raw number for Excel math, format is applied via cell style if possible, 
                    // but for community edition we often just send the number. 
                    // Or we can send formatted string if exact look is more important than math.
                    // Let's send number for now.
                    return Number(val)
                }

                if (col.format === 'date' && (val instanceof Date || typeof val === 'string')) {
                    return format(new Date(val), 'dd.MM.yyyy', { locale: tr })
                }

                return val
            })
            wsData.push(row)
        })

        // 4. Create Sheet
        const ws = XLSX.utils.aoa_to_sheet(wsData)

        // 5. Styling & Widths
        // Auto-calculate widths
        const wscols = columns.map((col, i) => {
            // Base width on header length
            let maxLength = col.header.length

            // Check first 10 rows of data to adjust width
            data.slice(0, 10).forEach(row => {
                const val = (row as any)[col.key]
                const len = val ? String(val).length : 0
                if (len > maxLength) maxLength = len
            })

            return { wch: Math.min(maxLength + 5, 50) } // Max width 50 chars
        })
        ws['!cols'] = wscols

        // Merge header cells for title (A1:C1, etc.)
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Facility Name
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Report Title
        ]

        XLSX.utils.book_append_sheet(wb, ws, 'Rapor')
        XLSX.writeFile(wb, `${options.filename}.xlsx`)
    },

    /**
     * Export data to a professionally formatted PDF file
     */
    toPDF: <T>(data: T[], columns: ExcelColumn[], options: ExportOptions) => {
        const doc = new jsPDF()

        // Add Turkish font support (Roboto)
        doc.addFont("https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf", "Roboto", "normal");
        doc.setFont("Roboto");

        const pageWidth = doc.internal.pageSize.width

        // 1. Header
        doc.setFontSize(18)
        doc.text(options.facilityName || 'NGO Yönetim', 14, 20)

        doc.setFontSize(14)
        doc.text(options.title, 14, 30)

        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Tarih: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })}`, 14, 38)

        if (options.dateRange) {
            doc.text(`Dönem: ${format(options.dateRange.start, 'dd.MM.yyyy')} - ${format(options.dateRange.end, 'dd.MM.yyyy')}`, 14, 44)
        }

        if (options.userName) {
            doc.text(`Oluşturan: ${options.userName}`, pageWidth - 14, 38, { align: 'right' })
        }

        // 2. Table
        const tableBody = data.map(item => {
            return columns.map(col => {
                const val = (item as any)[col.key]

                if (val === null || val === undefined) return '-'

                if (col.format === 'currency') {
                    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(val))
                }

                if (col.format === 'date') {
                    return format(new Date(val), 'dd.MM.yyyy', { locale: tr })
                }

                return String(val)
            })
        })

        autoTable(doc, {
            startY: 50,
            head: [columns.map(c => c.header)],
            body: tableBody,
            styles: {
                font: 'Roboto',
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [41, 128, 185], // Professional Blue
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            },
            margin: { top: 50 },
        })

        // 3. Footer (Page Numbers)
        const pageCount = (doc as any).internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150)
            doc.text(
                `Sayfa ${i} / ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            )
        }

        doc.save(`${options.filename}.pdf`)
    }
}
