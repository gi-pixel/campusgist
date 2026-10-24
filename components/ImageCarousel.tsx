'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export function ImageCarousel({ images }: { images: string[] }) {
  const [singleRatio, setSingleRatio] = useState(1)
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const count = images?.length ?? 0

  // Show/hide desktop arrows depending on scroll position
  const updateArrows = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [images])

  // Keyboard controls for fullscreen
  useEffect(() => {
    if (fullscreenIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreenIndex(null)
      if (e.key === 'ArrowLeft') setFullscreenIndex((i) => (i !== null && i > 0 ? i - 1 : i))
      if (e.key === 'ArrowRight') setFullscreenIndex((i) => (i !== null && i < count - 1 ? i + 1 : i))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreenIndex, count])

  if (!images || images.length === 0) return null

  const scrollByAmount = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  const openFullscreen = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    setFullscreenIndex(index)
  }

  const arrowBtn =
  'absolute top-1/2 hidden -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/80 group-hover:opacity-100 md:flex'

  return (
    <>
    {/* In-feed media: small previews, full size only on tap */}
    {images.length === 1 ? (
    // Single image: cropped into a compact box that follows its shape
    <div
        className="mt-3 w-full max-w-[300px] overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#222]"
        style={{ aspectRatio: singleRatio }}
    >
        <img
        src={images[0]}
        alt=""
        loading="lazy"
        onLoad={(e) => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget
            if (w && h) {
            // Clamp so very tall or very wide images don't take over the feed
            setSingleRatio(Math.min(1.5, Math.max(0.85, w / h)))
            }
        }}
        onClick={(e) => openFullscreen(e, 0)}
        className="h-full w-full cursor-pointer object-cover"
        />
    </div>
    ) : (
    // Multiple images: small swipeable thumbnails, next one peeks in
    <div className="group relative mt-3">
        <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex w-full snap-x snap-mandatory gap-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
        {images.map((url, i) => (
            <img
            key={i}
            src={url}
            alt=""
            loading="lazy"
            onClick={(e) => openFullscreen(e, i)}
            className="h-[220px] w-auto max-w-[75%] shrink-0 cursor-pointer snap-start rounded-2xl border border-[#2a2a2a] bg-[#222] object-cover sm:h-[240px]"
            />
        ))}
        </div>

        {canScrollLeft && (
        <button
            aria-label="Scroll left"
            onClick={(e) => { e.stopPropagation(); scrollByAmount(-1) }}
            className={`${arrowBtn} left-2`}
        >
            <ChevronLeft size={18} />
        </button>
        )}
        {canScrollRight && (
        <button
            aria-label="Scroll right"
            onClick={(e) => { e.stopPropagation(); scrollByAmount(1) }}
            className={`${arrowBtn} right-2`}
        >
            <ChevronRight size={18} />
        </button>
        )}
    </div>
    )}

      {/* Fullscreen modal */}
      {fullscreenIndex !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
          onClick={(e) => { e.stopPropagation(); setFullscreenIndex(null) }}
        >
          {/* Top bar: always above everything else */}
          <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              aria-label="Close"
              onClick={(e) => { e.stopPropagation(); setFullscreenIndex(null) }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X size={22} />
            </button>

            {images.length > 1 && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-[13px] tabular-nums text-white">
                {fullscreenIndex + 1} / {images.length}
              </span>
            )}
          </div>

          {/* Image area: ignores taps itself, so tapping empty space closes the viewer */}
          <div className="pointer-events-none relative flex h-full w-full items-center justify-center">
            {fullscreenIndex > 0 && (
              <button
                aria-label="Previous image"
                onClick={(e) => { e.stopPropagation(); setFullscreenIndex(fullscreenIndex - 1) }}
                className="pointer-events-auto absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft size={26} />
              </button>
            )}

            <img
              src={images[fullscreenIndex]}
              alt=""
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto max-h-[88vh] max-w-[94vw] select-none object-contain md:max-w-[90vw]"
            />

            {fullscreenIndex < images.length - 1 && (
              <button
                aria-label="Next image"
                onClick={(e) => { e.stopPropagation(); setFullscreenIndex(fullscreenIndex + 1) }}
                className="pointer-events-auto absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight size={26} />
              </button>
            )}
          </div>

          {/* Dots */}
          {images.length > 1 && (
            <div
              className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to image ${i + 1}`}
                  onClick={() => setFullscreenIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === fullscreenIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}