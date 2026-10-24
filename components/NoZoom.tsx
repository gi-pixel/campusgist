'use client'

import { useEffect } from 'react'

export function NoZoom() {
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault() // trackpad pinch / ctrl+scroll on desktop
    }

    document.addEventListener('gesturestart', prevent)
    document.addEventListener('gesturechange', prevent)
    document.addEventListener('gestureend', prevent)
    document.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      document.removeEventListener('gesturestart', prevent)
      document.removeEventListener('gesturechange', prevent)
      document.removeEventListener('gestureend', prevent)
      document.removeEventListener('wheel', onWheel)
    }
  }, [])

  return null
}