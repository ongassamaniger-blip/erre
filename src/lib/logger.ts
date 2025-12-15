/**
 * Logger Utility
 * 
 * Production'da console.log'ları otomatik olarak devre dışı bırakır
 * Development'ta normal çalışır
 */

const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment || isProduction) {
      console.warn(...args)
    }
  },
  error: (...args: any[]) => {
    // Error'lar her zaman gösterilmeli
    console.error(...args)
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
  table: (data: any) => {
    if (isDevelopment) {
      console.table(data)
    }
  },
  group: (label: string, fn: () => void) => {
    if (isDevelopment) {
      console.group(label)
      fn()
      console.groupEnd()
    }
  },
}

