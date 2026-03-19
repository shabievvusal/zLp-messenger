import {
  useState, useRef, useEffect, useCallback,
  KeyboardEvent, ChangeEvent, DragEvent
} from 'react'
import EmojiPickerReact, { EmojiClickData, Theme } from 'emoji-picker-react'
import { chatApi } from '@/api/chat'
import { useChatStore } from '@/store/chat'
import { useAuthStore } from '@/store/auth'
import { useChatCtx } from '@/contexts/ChatContext'
import { ReplyBar } from './ReplyBar'
import toast from 'react-hot-toast'

interface Props {
  chatId: string
}

export function MessageInput({ chatId }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recChunksRef = useRef<Blob[]>([])
  const recTimerRef = useRef<ReturnType<typeof setInterval>>()
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const addMessage = useChatStore((s) => s.addMessage)
  const updateMessage = useChatStore((s) => s.updateMessage)
  const user = useAuthStore((s) => s.user)
  const { replyTo, setReplyTo, editMsg, setEditMsg } = useChatCtx()

  // Pre-fill input when editing
  useEffect(() => {
    if (editMsg) {
      setText(editMsg.text ?? '')
      textareaRef.current?.focus()
    }
  }, [editMsg])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [text])

  // Keyboard shortcut: Escape clears reply/edit
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') { setReplyTo(null); setEditMsg(null) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const sendTypingEvent = useCallback(() => {
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {}, 3000)
  }, [])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')
    setShowEmoji(false)

    try {
      if (editMsg) {
        await chatApi.editMessage(editMsg.id, trimmed)
        updateMessage({ ...editMsg, text: trimmed, is_edited: true })
        setEditMsg(null)
      } else {
        const { data } = await chatApi.sendMessage(chatId, {
          text: trimmed,
          type: 'text',
          reply_to_id: replyTo?.id,
        })
        addMessage({ ...data, sender: user ?? undefined })
        setReplyTo(null)
      }
    } catch {
      toast.error('Failed to send')
      setText(trimmed)
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    sendTypingEvent()
  }

  const onEmojiClick = (data: EmojiClickData) => {
    setText((t) => t + data.emoji)
    textareaRef.current?.focus()
  }

  // File upload
  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('chat_id', chatId)
    if (replyTo) formData.append('reply_to_id', replyTo.id)

    try {
      const token = useAuthStore.getState().accessToken
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.message) addMessage({ ...data.message, sender: user ?? undefined })
      setReplyTo(null)
    } catch {
      toast.error('Upload failed')
    }
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    files.forEach(uploadFile)
    e.target.value = ''
  }

  // Drag & drop
  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    Array.from(e.dataTransfer.files).forEach(uploadFile)
  }

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      recChunksRef.current = []
      recorder.ondataavailable = (e) => recChunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(recChunksRef.current, { type: 'audio/ogg; codecs=opus' })
        const file = new File([blob], `voice_${Date.now()}.ogg`, { type: 'audio/ogg' })
        await uploadFile(file)
      }
      recorder.start()
      setRecording(true)
      setRecordSeconds(0)
      recTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    } catch {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    clearInterval(recTimerRef.current)
    recorderRef.current?.stop()
    setRecording(false)
    setRecordSeconds(0)
  }

  const cancelRecording = () => {
    clearInterval(recTimerRef.current)
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop())
    recorderRef.current = null
    setRecording(false)
    setRecordSeconds(0)
  }

  const fmtSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div
      className={`relative ${isDragging ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 z-10
          flex items-center justify-center pointer-events-none">
          <p className="text-primary-600 font-medium">Drop files to upload</p>
        </div>
      )}

      <ReplyBar />

      <div className="flex items-end gap-2 px-3 py-3
        bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">

        {recording ? (
          // Voice recording UI
          <div className="flex-1 flex items-center gap-3 px-4 py-2
            bg-red-50 dark:bg-red-900/20 rounded-full">
            <button onClick={cancelRecording} className="text-gray-400 hover:text-red-500 transition">✕</button>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-500 font-mono text-sm">{fmtSeconds(recordSeconds)}</span>
            <span className="flex-1 text-xs text-gray-500">Recording voice message...</span>
          </div>
        ) : (
          <>
            {/* Attach */}
            <button onClick={() => fileRef.current?.click()}
              className="icon-btn" title="Attach file">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileInput} multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.rar,.7z" />

            {/* Textarea */}
            <div className="flex-1 relative flex items-end
              bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={editMsg ? 'Edit message...' : 'Write a message...'}
                rows={1}
                className="flex-1 bg-transparent resize-none text-sm
                  text-gray-900 dark:text-gray-100 placeholder-gray-400
                  focus:outline-none leading-5 max-h-40 overflow-y-auto scrollbar-hide"
              />
              {/* Emoji button */}
              <button
                onClick={() => setShowEmoji((v) => !v)}
                className="ml-2 text-xl leading-none opacity-60 hover:opacity-100 transition flex-shrink-0 mb-0.5"
              >
                😊
              </button>
            </div>

            {/* Emoji picker */}
            {showEmoji && (
              <div className="absolute bottom-full right-16 z-50 mb-2">
                <EmojiPickerReact
                  onEmojiClick={onEmojiClick}
                  theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT}
                  width={320}
                  height={380}
                />
              </div>
            )}
            {showEmoji && (
              <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
            )}
          </>
        )}

        {/* Send / Voice */}
        {text.trim() ? (
          <button onClick={handleSend} disabled={sending}
            className="w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600
              flex items-center justify-center transition disabled:opacity-50 flex-shrink-0">
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        ) : recording ? (
          <button onClick={stopRecording}
            className="w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600
              flex items-center justify-center transition flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        ) : (
          <button
            onMouseDown={startRecording}
            onTouchStart={startRecording}
            title="Hold to record voice"
            className="icon-btn flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
