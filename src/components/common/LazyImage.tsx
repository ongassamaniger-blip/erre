import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  className?: string
  fallback?: string
}

/**
 * LazyImage - Lazy loading için optimize edilmiş image component
 * Intersection Observer API kullanarak görünür olduğunda yükler
 */
export function LazyImage({
  src,
  alt,
  placeholder,
  className,
  fallback = '/placeholder-image.png',
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder || src)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let observer: IntersectionObserver | null = null

    if (imgRef.current && placeholder) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src)
              observer?.disconnect()
            }
          })
        },
        {
          rootMargin: '50px', // 50px önceden yükle
        }
      )

      observer.observe(imgRef.current)
    }

    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [src, placeholder])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
    setImageSrc(fallback)
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      onLoad={handleLoad}
      onError={handleError}
      loading={placeholder ? 'lazy' : 'eager'}
      {...props}
    />
  )
}

