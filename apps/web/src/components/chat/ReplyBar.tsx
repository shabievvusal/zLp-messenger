import { useChatCtx } from '@/contexts/ChatContext'

export function ReplyBar() {
  const { replyTo, setReplyTo, editMsg, setEditMsg } = useChatCtx()
  const msg = replyTo ?? editMsg
  const isEdit = !!editMsg

  if (!msg) return null

  const dismiss = () => {
    setReplyTo(null)
    setEditMsg(null)
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2
      bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
      border-t border-black/5 dark:border-white/5 animate-slideDown">
      <div className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${isEdit ? 'bg-yellow-400' : 'bg-primary-500'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${isEdit ? 'text-yellow-500' : 'text-primary-500'}`}>
          {isEdit ? '✏️ Editing' : `↩ Reply to ${msg.sender?.first_name ?? 'message'}`}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {msg.text ?? '📎 Attachment'}
        </p>
      </div>
      <button
        onClick={dismiss}
        className="w-6 h-6 rounded-full flex items-center justify-center
          text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
          hover:bg-black/8 dark:hover:bg-white/10 transition-colors text-xs"
      >
        ✕
      </button>
    </div>
  )
}
