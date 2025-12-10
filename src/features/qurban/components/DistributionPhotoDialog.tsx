import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'

interface DistributionPhotoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  photoUrl: string | null | undefined
  distributionInfo?: {
    date: string
    campaignName: string
    region: string
  }
}

export function DistributionPhotoDialog({
  open,
  onOpenChange,
  photoUrl,
  distributionInfo,
}: DistributionPhotoDialogProps) {
  if (!photoUrl) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {distributionInfo
              ? `${distributionInfo.campaignName} - ${distributionInfo.region} Dağıtım Fotoğrafı`
              : 'Dağıtım Fotoğrafı'}
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <img
            src={photoUrl}
            alt="Dağıtım fotoğrafı"
            className="w-full h-auto rounded-lg"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onOpenChange(false)}
          >
            <X size={20} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

