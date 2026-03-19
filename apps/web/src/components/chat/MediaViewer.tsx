import { useEffect } from 'react'
import { useChatCtx } from '@/contexts/ChatContext'

export function MediaViewer() {
  const { mediaViewer, closeMedia } = useChatCtx()

  useEffect(() => {
    if (!mediaViewer) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMedia() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mediaViewer])

  if (!mediaViewer) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={closeMedia}
    >
      <button
        onClick={closeMedia}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10
          flex items-center justify-center text-white hover:bg-white/20 transition text-xl"
      >
        ✕
      </button>

      <div onClick={(e) => e.stopPropagation()} className="max-w-[90vw] max-h-[90vh]">
        {mediaViewer.type === 'photo' ? (
          <img
            src={mediaViewer.url}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
        ) : (
          <video
            src={mediaViewer.url}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[90vh] rounded-lg"
          />
        )}
      </div>

      {/* Download button */}
      <a
        href={mediaViewer.url}
        download
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/10
          flex items-center justify-center text-white hover:bg-white/20 transition"
        title="Download"
      >
        ↓
      </a>
    </div>
  )
}
