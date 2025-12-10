import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  distributionService,
  campaignService,
  donationService,
} from "@/services/qurban/qurbanService";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import type { DistributionRecord } from "@/types";
import {
  Package,
  Users,
  MapPin,
  Image as ImageIcon,
  X,
  Camera,
} from "@phosphor-icons/react";

interface CreateDistributionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  distribution?: DistributionRecord;
}

export function CreateDistributionDialog({
  open,
  onClose,
  onSuccess,
  distribution,
}: CreateDistributionDialogProps) {
  const selectedFacility = useAuthStore((state) => state.selectedFacility);
  const isEditing = !!distribution;

  const { data: campaigns = [] } = useQuery({
    queryKey: ["qurban-campaigns-distribution", selectedFacility?.id],
    queryFn: async () => {
      const all = await campaignService.getCampaigns({ facilityId: selectedFacility?.id })
      return all.filter(c => c.status === 'completed')
    },
    enabled: open && !!selectedFacility?.id,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [distributionType, setDistributionType] = useState<
    "bulk" | "individual"
  >(distribution?.distributionType || "bulk");
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    distribution?.photo || null,
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    date: distribution?.date || new Date().toISOString().split("T")[0],
    campaignId: distribution?.campaignId || "",
    campaignName: distribution?.campaignName || "",
    region: distribution?.region || "",
    // Toplu dağıtım
    packageCount: distribution?.packageCount?.toString() || "0",
    totalWeight: distribution?.totalWeight?.toString() || "0",
    distributionList: distribution?.distributionList || "",
    // Kişisel dağıtım (eski yapı)
    packageNumber: distribution?.packageNumber || "",
    recipientName: distribution?.recipientName || "",
    recipientCode: distribution?.recipientCode || "",
    weight: distribution?.weight?.toString() || "0",
    // Ortak
    status: distribution?.status || ("pending" as DistributionRecord["status"]),
    receivedBy: distribution?.receivedBy || "",
    notes: distribution?.notes || "",
  });

  // Auto-generate package code when switching to individual type if empty
  useEffect(() => {
    if (distributionType === 'individual' && !formData.packageNumber && !isEditing) {
      const randomCode = `PKG-${Math.floor(1000 + Math.random() * 9000)}`
      setFormData(prev => ({ ...prev, packageNumber: randomCode }))
    }
  }, [distributionType, isEditing, formData.packageNumber])

  // Fetch donors for selected campaign
  const { data: donors = [] } = useQuery({
    queryKey: ["qurban-donors", formData.campaignId],
    queryFn: () => donationService.getCampaignDonors(formData.campaignId),
    enabled: !!formData.campaignId && distributionType === "individual",
  });

  const handleDonorSelect = (donorId: string) => {
    const donor = donors.find((d) => d.id === donorId);
    if (donor) {
      setFormData({
        ...formData,
        recipientName: donor.donorName,
        recipientCode: donor.donorPhone, // Using phone as code/identifier
        region: donor.deliveryAddress || donor.distributionRegion || "",
        weight: (
          donor.shareCount *
          (donor.qurbanType === "sheep" || donor.qurbanType === "goat"
            ? 20
            : 25)
        ).toString(), // Estimated weight
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const campaign = campaigns.find((c) => c.id === data.campaignId);

      // Upload photo if new file selected
      let photoUrl: string | undefined = photoPreview || undefined;
      if (photoFile) {
        try {
          photoUrl = await distributionService.uploadDistributionPhoto(photoFile)
        } catch (error) {
          console.error('Photo upload failed', error)
          toast.error('Fotoğraf yüklenemedi, işlem fotoğrafsız devam edecek.')
        }
      }

      const baseData = {
        date: data.date,
        campaignId: data.campaignId,
        campaignName: campaign?.name || data.campaignName,
        distributionType,
        facilityId: selectedFacility?.id,
        status: data.status,
        notes: data.notes || undefined,
        photo: photoUrl,
      };

      if (distributionType === "bulk") {
        const packageCount = parseInt(data.packageCount) || 0;
        const totalWeight = parseFloat(data.totalWeight) || 0;
        const averageWeight = packageCount > 0 ? totalWeight / packageCount : 0;

        return isEditing
          ? distributionService.updateDistribution(distribution!.id, {
            ...baseData,
            region: data.region,
            packageCount,
            totalWeight,
            averageWeightPerPackage: averageWeight,
            distributionList: data.distributionList || undefined,
          })
          : distributionService.createDistribution({
            ...baseData,
            region: data.region,
            packageCount,
            totalWeight,
            averageWeightPerPackage: averageWeight,
            distributionList: data.distributionList || undefined,
          });
      } else {
        // Kişisel dağıtım
        return isEditing
          ? distributionService.updateDistribution(distribution!.id, {
            ...baseData,
            packageNumber: data.packageNumber || `PKG-${Date.now()}`,
            recipientName: data.recipientName,
            recipientCode: data.recipientCode || undefined,
            weight: parseFloat(data.weight) || 0,
            region: data.region,
          })
          : distributionService.createDistribution({
            ...baseData,
            packageNumber: data.packageNumber || `PKG-${Date.now()}`,
            recipientName: data.recipientName,
            recipientCode: data.recipientCode || undefined,
            weight: parseFloat(data.weight) || 0,
            region: data.region,
          });
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing
          ? "Dağıtım kaydı güncellendi"
          : "Dağıtım kaydı oluşturuldu",
      );
      if (!isEditing) {
        setPhotoPreview(null);
        setPhotoFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast.error(`Bir hata oluştu: ${error.message || "Bilinmeyen hata"}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.campaignId) {
      toast.error("Gerekli alanları doldurun");
      return;
    }
    if (distributionType === "bulk") {
      if (!formData.region || !formData.packageCount || !formData.totalWeight) {
        toast.error("Bölge, paket sayısı ve toplam ağırlık gereklidir");
        return;
      }
    } else {
      if (!formData.recipientName || !formData.region) {
        toast.error("Alıcı adı ve bölge gereklidir");
        return;
      }
    }
    createMutation.mutate(formData);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Fotoğraf boyutu 5MB'dan küçük olmalıdır");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Lütfen geçerli bir resim dosyası seçin");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (!isEditing) {
      setPhotoPreview(null);
      setPhotoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Dağıtım Kaydını Düzenle"
              : "Yeni Et Dağıtım Kaydı"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Dağıtım kaydı bilgilerini güncelleyin"
              : "Toplu veya kişisel et dağıtım kaydı oluşturun"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* DaÄŸÄ±tÄ±m Tipi SeÃ§imi */}
          <div className="space-y-3">
            <Label>Dağıtım Tipi *</Label>
            <RadioGroup
              value={distributionType}
              onValueChange={(value) =>
                setDistributionType(value as "bulk" | "individual")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bulk" id="bulk" />
                <Label
                  htmlFor="bulk"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Package size={20} />
                  <span>Toplu Dağıtım</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label
                  htmlFor="individual"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Users size={20} />
                  <span>Kişisel Dağıtım</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Ortak Alanlar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tarih *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Kampanya *</Label>
              <Select
                value={formData.campaignId}
                onValueChange={(value) => {
                  const campaign = campaigns.find((c) => c.id === value);
                  setFormData({
                    ...formData,
                    campaignId: value,
                    campaignName: campaign?.name || "",
                  });
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kampanya seçin" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toplu DaÄŸÄ±tÄ±m AlanlarÄ± */}
          {distributionType === "bulk" && (
            <>
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={20} className="text-primary" />
                  <h3 className="font-semibold">Toplu Dağıtım Bilgileri</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bölge *</Label>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-muted-foreground" />
                      <Input
                        value={formData.region}
                        onChange={(e) =>
                          setFormData({ ...formData, region: e.target.value })
                        }
                        placeholder="Dağıtım bölgesi (örn: Gaziantep)"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Paket Sayısı *</Label>
                    <Input
                      type="number"
                      value={formData.packageCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          packageCount: e.target.value,
                        })
                      }
                      min="1"
                      placeholder="Örn: 50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Toplam Ağırlık (kg) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.totalWeight}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalWeight: e.target.value,
                        })
                      }
                      min="0"
                      placeholder="Örn: 425.5"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ortalama Ağırlık (kg/paket)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={
                        formData.packageCount && formData.totalWeight
                          ? (
                            parseFloat(formData.totalWeight) /
                            parseInt(formData.packageCount)
                          ).toFixed(2)
                          : "0"
                      }
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Dağıtım Listesi (Opsiyonel)</Label>
                  <Textarea
                    value={formData.distributionList || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        distributionList: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Dağıtım detayları, alıcı listesi veya notlar..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Dağıtım detaylarını, alıcı listesini veya özel
                    notları buraya ekleyebilirsiniz.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* KiÅŸisel DaÄŸÄ±tÄ±m AlanlarÄ± */}
          {distributionType === "individual" && (
            <>
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={20} className="text-primary" />
                  <h3 className="font-semibold">
                    Kişisel Dağıtım Bilgileri
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bölge *</Label>
                    <Input
                      value={formData.region}
                      onChange={(e) =>
                        setFormData({ ...formData, region: e.target.value })
                      }
                      placeholder="Dağıtım bölgesi"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bağışçıdan Seç (Opsiyonel)</Label>
                    <Select onValueChange={handleDonorSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Bağışçı seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {donors.map((donor) => (
                          <SelectItem key={donor.id} value={donor.id}>
                            {donor.donorName} - {donor.shareCount} Hisse
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Paket Numarası</Label>
                    <Input
                      value={formData.packageNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          packageNumber: e.target.value,
                        })
                      }
                      placeholder="Otomatik oluşturulacak"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alıcı Adı *</Label>
                    <Input
                      value={formData.recipientName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recipientName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alıcı Kodu</Label>
                    <Input
                      value={formData.recipientCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recipientCode: e.target.value,
                        })
                      }
                      placeholder="RCP-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ağırlık (kg) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Ortak Alanlar */}
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as DistributionRecord["status"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="delivered">Teslim Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.status === "delivered" && (
                <div className="space-y-2">
                  <Label>Teslim Alan</Label>
                  <Input
                    value={formData.receivedBy || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, receivedBy: e.target.value })
                    }
                    placeholder="Teslim alan kişi adı"
                  />
                </div>
              )}
            </div>

            {/* FotoÄŸraf YÃ¼kleme */}
            <div className="space-y-2">
              <Label>Dağıtım Fotoğrafı</Label>
              <div className="space-y-3">
                {photoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={photoPreview}
                      alt="Dağıtım fotoğrafı"
                      className="w-full max-w-md h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemovePhoto}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera
                      size={32}
                      className="mx-auto mb-2 text-muted-foreground"
                    />
                    <p className="text-sm text-muted-foreground mb-1">
                      Fotoğraf eklemek için tıklayın
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG veya JPEG (Max 5MB)
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                {!photoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={16} className="mr-2" />
                    Fotoğraf Seç
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                placeholder="Ek notlar..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? "Kaydediliyor..."
                : isEditing
                  ? "Güncelle"
                  : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
