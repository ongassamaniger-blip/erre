import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Image, X, Upload } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface LogoUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLogo?: string
  onUpload: (logoUrl: string) => void
}

export function LogoUploadDialog({
  open,
  onOpenChange,
  currentLogo,
  onUpload,
}: LogoUploadDialogProps) {
  const [preview, setPreview] = useState<string | null>(currentLogo || null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Dosya tipi kontrolü
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin')
      return
    }

    // Dosya boyutu kontrolü (2MB)
    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error('Dosya boyutu 2MB\'dan büyük olamaz')
      return
    }

    setFile(selectedFile)

    // Preview oluştur
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleRemove = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = () => {
    if (!file && !preview) {
      toast.error('Lütfen bir logo seçin')
      return
    }

    if (file) {
      // Gerçek uygulamada burada dosya yükleme API çağrısı yapılacak
      // Şimdilik base64 veya geçici URL kullanıyoruz
      const reader = new FileReader()
      reader.onloadend = () => {
        const logoUrl = reader.result as string
        onUpload(logoUrl)
        toast.success('Logo başarıyla yüklendi')
        onOpenChange(false)
        setFile(null)
      }
      reader.readAsDataURL(file)
    } else if (preview) {
      onUpload(preview)
      toast.success('Logo güncellendi')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Logo Yükle</DialogTitle>
          <DialogDescription>
            Şube logosunu yükleyin. PNG, JPG veya SVG formatında olmalıdır (Max: 2MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center">
            {preview ? (
              <div className="relative">
                <div className="w-48 h-48 rounded-lg border flex items-center justify-center overflow-hidden bg-muted">
                  <img src={preview} alt="Logo preview" className="w-full h-full object-contain" />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemove}
                >
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div className="w-48 h-48 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Image size={48} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Logo önizlemesi</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-file">Logo Dosyası</Label>
            <Input
              id="logo-file"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <p className="text-xs text-muted-foreground">
              PNG, JPG veya SVG formatında logo yükleyebilirsiniz (Max: 2MB)
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleUpload} disabled={!preview} className="gap-2">
            <Upload size={16} />
            Yükle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

