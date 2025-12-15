# Performans Optimizasyonları

Bu dokümantasyon, projede yapılan performans optimizasyonlarını açıklar.

## 🚀 Yapılan Optimizasyonlar

### 1. Vite Build Optimizasyonları

#### Chunk Splitting
- Vendor chunk'ları ayrıldı (react, ui, chart, form, vb.)
- Her chunk kategorize edildi
- Manuel chunk splitting ile optimal bundle boyutları

#### Minification
- Terser kullanılarak minification
- Production'da console.log'lar otomatik kaldırılıyor
- Source maps sadece development'ta aktif

#### Asset Optimization
- Image, font ve diğer asset'ler kategorize edildi
- Optimal dosya isimlendirme (hash ile cache busting)

**Dosya**: `vite.config.ts`

### 2. React Query Cache Optimizasyonları

#### Stale Time
- Varsayılan staleTime: 5 dakika
- Veri 5 dakika boyunca fresh kabul edilir
- Gereksiz refetch'ler önlenir

#### Garbage Collection Time
- gcTime: 10 dakika (eski cacheTime)
- Kullanılmayan cache'ler 10 dakika sonra temizlenir

**Dosya**: `src/App.tsx`

### 3. Component Optimizasyonları

#### useDebounce Hook
- Arama input'ları için debounce
- 300ms gecikme ile gereksiz API çağrıları önlenir
- Örnek: `EmployeesPage` arama özelliği

#### useMemo & useCallback
- Büyük listeler için memoization
- Callback fonksiyonlar memoize edildi
- Gereksiz re-render'lar önlenir

**Dosya**: `src/features/hr/employees/EmployeesPage.tsx`

### 4. Lazy Loading

#### Route-based Code Splitting
- Tüm sayfalar lazy load ediliyor
- React.lazy ve Suspense kullanılıyor
- İlk yükleme süresi optimize edildi

**Dosya**: `src/App.tsx`

### 5. Image Optimization

#### LazyImage Component
- Intersection Observer API kullanılıyor
- Görünür olduğunda yüklenir
- Placeholder desteği

**Dosya**: `src/components/common/LazyImage.tsx`

### 6. Logger Utility

#### Production Console Log Temizleme
- Development'ta normal çalışır
- Production'da console.log'lar otomatik kaldırılır
- Error ve warn her zaman gösterilir

**Dosya**: `src/lib/logger.ts`

**Kullanım**:
```typescript
import { logger } from '@/lib/logger'

logger.log('Debug mesajı') // Sadece development'ta
logger.error('Hata mesajı') // Her zaman gösterilir
```

### 7. Bundle Analyzer

#### Build Analiz Scripti
- Bundle boyutlarını analiz eder
- Büyük chunk'ları tespit eder
- Optimizasyon önerileri sunar

**Kullanım**:
```bash
npm run analyze
# veya
npm run build:analyze
```

**Dosya**: `scripts/analyze-bundle.ts`

## 📊 Performans Metrikleri

### Öncesi vs Sonrası (Tahmini)

| Metrik | Öncesi | Sonrası | İyileştirme |
|--------|--------|---------|-------------|
| İlk Yükleme | ~2.5MB | ~1.8MB | %28 ⬇️ |
| Time to Interactive | ~3.5s | ~2.2s | %37 ⬇️ |
| Bundle Chunks | 1-2 | 10+ | Daha iyi cache |
| Re-render Sayısı | Yüksek | Düşük | Memoization |

## 🛠️ Yeni Hook'lar

### useDebounce
```typescript
import { useDebounce } from '@/hooks/use-debounce'

const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300)

// debouncedSearch değiştiğinde API çağrısı yap
```

### useThrottle
```typescript
import { useThrottle } from '@/hooks/use-throttle'

const throttledValue = useThrottle(value, 300)
```

### useMemoizedCallback
```typescript
import { useMemoizedCallback } from '@/hooks/use-memoized-callback'

const callback = useMemoizedCallback((arg) => {
  // ...
}, [dependency1, dependency2])
```

## 📝 Best Practices

### 1. Büyük Listeler İçin
- ✅ `useMemo` ile filtreleme
- ✅ `useDebounce` ile arama
- ✅ Pagination kullan
- ⚠️ Virtual scrolling (gelecekte eklenebilir)

### 2. Component Optimizasyonu
- ✅ `React.memo` ile gereksiz re-render önle
- ✅ `useCallback` ile callback memoize et
- ✅ `useMemo` ile hesaplamaları cache'le

### 3. API Çağrıları
- ✅ React Query cache kullan
- ✅ `staleTime` ayarla
- ✅ `enabled` ile conditional fetching

### 4. Images
- ✅ `LazyImage` component kullan
- ✅ WebP format kullan (mümkünse)
- ✅ Responsive images

### 5. Build
- ✅ Production build kullan
- ✅ Bundle analyzer çalıştır
- ✅ Chunk splitting kontrol et

## 🔍 Monitoring

### Bundle Size
```bash
npm run analyze
```

### Performance Profiling
- React DevTools Profiler kullan
- Chrome DevTools Performance tab
- Lighthouse audit

## 🚧 Gelecek Optimizasyonlar

1. **Virtual Scrolling**
   - Büyük listeler için react-window veya react-virtuoso
   - 1000+ item için gerekli

2. **Service Worker**
   - Offline support
   - Cache strategies

3. **Image Optimization**
   - WebP format
   - Responsive images
   - CDN entegrasyonu

4. **Code Splitting**
   - Route-based (✅ Yapıldı)
   - Component-based (kısmen)
   - Library-based (✅ Yapıldı)

5. **Prefetching**
   - Route prefetching
   - Data prefetching

## 📚 Kaynaklar

- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [React Performance](https://react.dev/learn/render-and-commit)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/important-defaults)

---

**Son Güncelleme**: 2024
**Versiyon**: 1.0

