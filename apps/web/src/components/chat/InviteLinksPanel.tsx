import { useEffect, useState } from 'react'
import { chatApi } from '@/api/chat'

interface Props {
  chatId: string
  onBack: () => void
}

export function InviteLinksPanel({ chatId, onBack }: Props) {
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    chatApi.getInviteLink(chatId)
      .then(({ data }) => setLink(data.invite_link))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [chatId])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = async () => {
    if (!confirm('Сбросить ссылку? Старая ссылка перестанет работать.')) return
    setResetting(true)
    try {
      const { data } = await chatApi.resetInviteLink(chatId)
      setLink(data.invite_link)
    } catch { /* ignore */ }
    finally { setResetting(false) }
  }

  return (
    <>
      <div className="absolute right-0 top-0 bottom-0 w-80 z-[60]
        bg-white dark:bg-gray-900
        shadow-2xl border-l border-black/8 dark:border-white/8
        flex flex-col animate-slideInRight">

        <div className="flex items-center gap-2 px-3 py-3
          border-b border-black/8 dark:border-white/8 flex-shrink-0">
          <button onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full
              hover:bg-black/8 dark:hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Пригласительная ссылка</span>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Link display */}
              <div className="bg-black/4 dark:bg-white/6 rounded-2xl p-4">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-2">
                  Ссылка для вступления
                </p>
                <p className="text-sm text-primary-500 font-medium break-all leading-relaxed">{link}</p>
              </div>

              {/* QR placeholder */}
              <div className="flex flex-col items-center py-4 gap-3">
                <div className="w-36 h-36 bg-black/4 dark:bg-white/6 rounded-2xl
                  flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h7v7H3zm1 1v5h5V4zm1 1h3v3H5zm8-2h7v7h-7zm1 1v5h5V4zm1 1h3v3h-3zM3 13h7v7H3zm1 1v5h5v-5zm1 1h3v3H5zm10 1h2v2h-2zm-3 0h2v2h-2zm0 3h2v2h-2zm3 0h2v2h-2zm0 3h2v2h-2zm-3-6h2v2h-2zm0 6h2v2h-2zm3-3h2v2h-2z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-400">QR-код для быстрого вступления</p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl
                    bg-primary-50 dark:bg-primary-900/20
                    hover:bg-primary-100 dark:hover:bg-primary-900/30
                    active:scale-98 transition-all text-left">
                  <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {copied
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    }
                  </svg>
                  <span className="text-sm font-medium text-primary-500">
                    {copied ? 'Скопировано!' : 'Скопировать ссылку'}
                  </span>
                </button>

                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl
                    hover:bg-red-50 dark:hover:bg-red-900/20
                    active:scale-98 transition-all text-left disabled:opacity-50">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm font-medium text-red-500">
                    {resetting ? 'Сброс...' : 'Сбросить ссылку'}
                  </span>
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center px-2">
                Любой, у кого есть эта ссылка, сможет вступить в группу
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
