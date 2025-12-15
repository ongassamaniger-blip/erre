#!/usr/bin/env tsx
/**
 * Bundle Analyzer Script
 * 
 * Vite build sonrası bundle boyutlarını analiz eder
 * Kullanım: npm run analyze
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

interface ChunkInfo {
  name: string
  size: number
  gzipped?: number
  path: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function getGzipSize(filePath: string): number {
  // Basit bir tahmin (gerçek gzip için zlib kullanılabilir)
  // Genellikle gzip %70-80 oranında küçültür
  const size = statSync(filePath).size
  return Math.round(size * 0.3)
}

function analyzeBuild() {
  const distPath = join(process.cwd(), 'dist')
  
  try {
    const files = readdirSync(distPath, { recursive: true })
    const chunks: ChunkInfo[] = []
    let totalSize = 0

    files.forEach((file) => {
      const filePath = join(distPath, file as string)
      const stats = statSync(filePath)
      
      if (stats.isFile() && (file.toString().endsWith('.js') || file.toString().endsWith('.css'))) {
        const size = stats.size
        totalSize += size
        const gzipped = getGzipSize(filePath)
        
        chunks.push({
          name: file.toString(),
          size,
          gzipped,
          path: filePath,
        })
      }
    })

    // Boyuta göre sırala
    chunks.sort((a, b) => b.size - a.size)

    console.log('\n📦 Bundle Analysis\n')
    console.log('═'.repeat(80))
    console.log('File'.padEnd(50) + 'Size'.padEnd(15) + 'Gzipped')
    console.log('═'.repeat(80))

    chunks.forEach((chunk) => {
      const name = chunk.name.length > 48 ? chunk.name.substring(0, 45) + '...' : chunk.name
      console.log(
        name.padEnd(50) +
        formatBytes(chunk.size).padEnd(15) +
        formatBytes(chunk.gzipped || 0)
      )
    })

    console.log('═'.repeat(80))
    console.log(`Total: ${formatBytes(totalSize)} (${formatBytes(Math.round(totalSize * 0.3))} gzipped)`)
    console.log('═'.repeat(80))

    // Uyarılar
    const largeChunks = chunks.filter(c => c.size > 500 * 1024) // 500KB'den büyük
    if (largeChunks.length > 0) {
      console.log('\n⚠️  Large Chunks (>500KB):')
      largeChunks.forEach(chunk => {
        console.log(`   - ${chunk.name}: ${formatBytes(chunk.size)}`)
      })
      console.log('\n💡 Consider code splitting for these chunks')
    }

    // Öneriler
    console.log('\n💡 Optimization Tips:')
    console.log('   1. Use dynamic imports for large components')
    console.log('   2. Enable tree shaking for unused code')
    console.log('   3. Consider lazy loading routes')
    console.log('   4. Optimize images and assets')
    console.log('   5. Use production build with minification\n')

  } catch (error) {
    console.error('❌ Error analyzing build:', error)
    console.log('\n💡 Make sure to run "npm run build" first\n')
    process.exit(1)
  }
}

analyzeBuild()

