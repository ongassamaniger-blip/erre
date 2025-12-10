import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X, FilePdf, FileImage, FileText } from '@phosphor-icons/react'
import { TransactionDocument } from '@/types/finance'

interface DocumentViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: TransactionDocument | null
}

export function DocumentViewer({ open, onOpenChange, document }: DocumentViewerProps) {
  const [imageError, setImageError] = useState(false)
  const [pdfError, setPdfError] = useState(false)

  // Tüm hook'ları en üstte tanımla - koşullu return'lerden önce
  const isPdf = document?.type?.includes('pdf') || false
  const isImage = document?.type?.includes('image') || false

  // Mock URL oluştur - gerçek uygulamada document.url kullanılır
  // PDF için blob URL oluştur
  const documentUrl = useMemo(() => {
    if (!document) return null
    if (document.url) return document.url
    
    if (document.type?.includes('pdf')) {
      // Mock PDF içeriği oluştur
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Mock PDF Document) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000054 00000 n 
0000000102 00000 n 
0000000276 00000 n 
0000000345 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
424
%%EOF`
      const blob = new Blob([pdfContent], { type: 'application/pdf' })
      return URL.createObjectURL(blob)
    }
    
    return `#document-${document.id}`
  }, [document?.url, document?.id, document?.type])

  // Cleanup blob URL when component unmounts or document changes
  useEffect(() => {
    return () => {
      if (documentUrl && typeof documentUrl === 'string' && documentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(documentUrl)
      }
    }
  }, [documentUrl])

  useEffect(() => {
    if (open) {
      setImageError(false)
      setPdfError(false)
    }
  }, [open, document])

  const getFileIcon = (type: string) => {
    if (type?.includes('pdf')) return FilePdf
    if (type?.includes('image')) return FileImage
    return FileText
  }

  const getFileTypeLabel = (type: string) => {
    if (type?.includes('pdf')) return 'PDF'
    if (type?.includes('image')) return 'Resim'
    if (type?.includes('word')) return 'Word'
    if (type?.includes('excel') || type?.includes('spreadsheet')) return 'Excel'
    return 'Dosya'
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleDownload = () => {
    if (!document) return
    // Mock belge indirme - gerçek uygulamada document.url kullanılır
    const blob = new Blob(['Mock document content'], { type: document.type })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = document.name
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!document) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Belge Bulunamadı</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            Görüntülenecek belge bulunamadı.
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const FileIcon = getFileIcon(document.type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileIcon size={24} className="text-primary" />
              <div>
                <DialogTitle className="text-left">{document.name}</DialogTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  {getFileTypeLabel(document.type)} • {formatFileSize(document.size)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download size={16} className="mr-2" />
                İndir
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X size={20} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-auto max-h-[calc(90vh-120px)]">
          {isImage ? (
            <div className="flex items-center justify-center bg-muted rounded-lg p-8">
              {imageError ? (
                <div className="text-center py-12">
                  <FileImage size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Resim görüntülenemiyor</p>
                  <p className="text-sm text-muted-foreground mt-2">Belgeyi indirerek görüntüleyebilirsiniz</p>
                  <Button className="mt-4" onClick={handleDownload}>
                    <Download size={16} className="mr-2" />
                    Resmi İndir
                  </Button>
                </div>
              ) : (
                <img
                  src={documentUrl}
                  alt={document.name}
                  className="max-w-full max-h-[70vh] object-contain rounded"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          ) : isPdf ? (
            <div className="w-full">
              {pdfError ? (
                <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-8 min-h-[400px]">
                  <FilePdf size={64} className="text-red-500 mb-4" />
                  <p className="text-lg font-medium mb-2">PDF Görüntülenemedi</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    PDF dosyası görüntülenemedi. Lütfen indirerek görüntüleyin.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Dosya Adı:</strong> {document.name}</p>
                    <p><strong>Boyut:</strong> {formatFileSize(document.size)}</p>
                    <p><strong>Tip:</strong> {getFileTypeLabel(document.type)}</p>
                    <p><strong>Yüklenme Tarihi:</strong> {new Date(document.uploadedAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <Button className="mt-4" onClick={handleDownload}>
                    <Download size={16} className="mr-2" />
                    PDF'i İndir
                  </Button>
                </div>
              ) : (
                <div className="w-full h-[calc(90vh-200px)] border rounded-lg overflow-hidden bg-white">
                  <iframe
                    src={documentUrl}
                    className="w-full h-full border-0"
                    title={document.name}
                    onError={() => setPdfError(true)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-8 min-h-[400px]">
              <FileText size={64} className="text-blue-500 mb-4" />
              <p className="text-lg font-medium mb-2">{document.name}</p>
              <div className="space-y-2 text-sm text-muted-foreground text-center">
                <p><strong>Dosya Tipi:</strong> {getFileTypeLabel(document.type)}</p>
                <p><strong>Boyut:</strong> {formatFileSize(document.size)}</p>
                <p><strong>Yüklenme Tarihi:</strong> {new Date(document.uploadedAt).toLocaleDateString('tr-TR')}</p>
              </div>
              <Button className="mt-4" onClick={handleDownload}>
                <Download size={16} className="mr-2" />
                Dosyayı İndir
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

