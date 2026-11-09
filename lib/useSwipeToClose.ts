'use client'

import { useEffect, useRef } from 'react'

// Nearest vertically scrollable ancestor that actually has overflow
function findScroller(target: HTMLElement | null, root: HTMLElement): HTMLElement | null {
  let el = target
  while (el && el !== root) {
    const { overflowY } = getComputedStyle(el)
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      return el
    }
    el = el.parentElement
  }
  return null
}

export function useSwipeToClose(active: boolean, onClose: () => void) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const sheet = sheetRef.current
    if (!active || !sheet) return
    const sheetEl: HTMLDivElement = sheet

    let startX = 0
    let startY = 0
    let startT = 0
    let lastDy = 0
    let tracking = false
    let dragging = false
    let scroller: HTMLElement | null = null

    const isMobile = () => window.matchMedia('(max-width: 639px)').matches

    function onStart(e: TouchEvent) {
      if (!isMobile() || e.touches.length !== 1) return
      const target = e.target as HTMLElement
      // Leave inputs and marked areas (fullscreen viewer, edit modal) alone
      if (target.closest('[data-no-swipe], textarea, input')) return

      tracking = true
      dragging = false
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startT = Date.now()
      lastDy = 0
      scroller = findScroller(target, sheetEl)
    }

    function onMove(e: TouchEvent) {
      if (!tracking) return
      const x = e.touches[0].clientX
      const y = e.touches[0].clientY

      if (!dragging) {
        // Content is scrolled down: let it scroll, and measure from here
        if (scroller && scroller.scrollTop > 0) {
          startX = x
          startY = y
          return
        }
        const dy = y - startY
        const dx = x - startX
        if (dy > 8 && dy > Math.abs(dx) * 1.2) {
          dragging = true
          sheetEl.style.transition = 'none'
        } else if (dy < -8 || Math.abs(dx) > 12) {
          tracking = false // upward or sideways: hand over to normal scrolling
          return
        } else {
          return
        }
      }

      e.preventDefault() // we own the gesture now
      const dy = Math.max(0, y - startY - 8)
      lastDy = dy
      sheetEl.style.transform = `translateY(${dy}px)`
      const backdrop = backdropRef.current
      if (backdrop) {
        backdrop.style.opacity = String(Math.max(0, 1 - dy / (sheetEl.offsetHeight * 0.9)))
      }
    }

    function onEnd(cancelled: boolean) {
      if (!tracking) return
      tracking = false
      if (!dragging) return
      dragging = false

      const elapsed = Math.max(1, Date.now() - startT)
      const velocity = lastDy / elapsed // px per ms
      const farEnough = lastDy > Math.min(140, sheetEl.offsetHeight * 0.25)
      const shouldClose = !cancelled && (farEnough || velocity > 0.7)
      const backdrop = backdropRef.current

      sheetEl.style.transition = 'transform 220ms ease-out'
      if (backdrop) backdrop.style.transition = 'opacity 220ms'

      if (shouldClose) {
        sheetEl.style.transform = 'translateY(100%)'
        if (backdrop) backdrop.style.opacity = '0'
        setTimeout(() => onCloseRef.current(), 200)
      } else {
        sheetEl.style.transform = 'translateY(0px)'
        if (backdrop) backdrop.style.opacity = '1'
        // Clear the transform completely afterwards: a leftover transform would
        // break position:fixed children (the fullscreen image viewer, edit modal)
        setTimeout(() => {
          sheetEl.style.transition = ''
          sheetEl.style.transform = ''
          if (backdrop) {
            backdrop.style.transition = ''
            backdrop.style.opacity = ''
          }
        }, 230)
      }
    }

    const handleEnd = () => onEnd(false)
    const handleCancel = () => onEnd(true)

    sheetEl.addEventListener('touchstart', onStart, { passive: true })
    sheetEl.addEventListener('touchmove', onMove, { passive: false })
    sheetEl.addEventListener('touchend', handleEnd)
    sheetEl.addEventListener('touchcancel', handleCancel)

    return () => {
      sheetEl.removeEventListener('touchstart', onStart)
      sheetEl.removeEventListener('touchmove', onMove)
      sheetEl.removeEventListener('touchend', handleEnd)
      sheetEl.removeEventListener('touchcancel', handleCancel)
    }
  }, [active])

  return { sheetRef, backdropRef }
}