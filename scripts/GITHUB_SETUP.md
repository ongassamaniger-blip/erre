# GitHub Projelerini Listeleme

Bu script, GitHub hesabınıza bağlanıp tüm projelerinizi listeler.

## Kullanım

### 1. GitHub Personal Access Token Oluşturma

1. https://github.com/settings/tokens adresine gidin
2. "Generate new token" → "Generate new token (classic)" tıklayın
3. Token'a bir isim verin (örn: "Proje Listeleme")
4. İzinler bölümünde **"repo"** seçeneğini işaretleyin
5. "Generate token" tıklayın
6. Token'ı kopyalayın (bir daha gösterilmeyecek!)

### 2. Token'ı Ayarlama

**Seçenek 1: .env dosyasına ekleyin (Önerilen)**
```bash
# Proje kök dizinindeki .env dosyasına ekleyin
GITHUB_TOKEN=ghp_your_token_here
```

**Seçenek 2: Script çalıştırıldığında girin**
Script size token girmenizi isteyecektir.

### 3. Script'i Çalıştırma

```bash
npm run github:list
```

veya

```bash
tsx scripts/list-github-projects.ts
```

## Çıktı

Script şunları gösterecektir:
- ✅ Bağlantı durumu ve kullanıcı bilgileri
- 📊 Toplam proje sayısı ve kategoriler
- 📋 Tüm projelerin detaylı listesi
- 📈 İstatistikler (yıldızlar, fork'lar, kullanılan diller)

## Özellikler

- Tüm repoları listeler (public, private, fork, arşivlenmiş)
- Proje kategorilerine göre gruplar
- Dil istatistikleri
- Son güncelleme tarihleri
- Yıldız ve fork sayıları


