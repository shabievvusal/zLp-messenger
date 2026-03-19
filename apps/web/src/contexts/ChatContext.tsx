import { createContext, useContext, useState, useCallback } from 'react'
import type { Message } from '@/types'

interface ChatContextValue {
  replyTo: Message | null
  setReplyTo: (msg: Message | null) => void
  editMsg: Message | null
  setEditMsg: (msg: Message | null) => void
  forwardMsg: Message | null
  setForwardMsg: (msg: Message | null) => void
  mediaViewer: { url: string; type: 'photo' | 'video' } | null
  openMedia: (url: string, type: 'photo' | 'video') => void
  closeMedia: () => void
  clearInput: () => void
  onClearInput: (fn: () => void) => void
}

const ChatContext = createContext<ChatContextValue>({} as ChatContextValue)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [replyTo, setReplyToState] = useState<Message | null>(null)
  const [editMsg, setEditMsgState] = useState<Message | null>(null)
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null)
  const [mediaViewer, setMediaViewer] = useState<{ url: string; type: 'photo' | 'video' } | null>(null)
  const [clearFn, setClearFn] = useState<(() => void) | null>(null)

  const setReplyTo = useCallback((msg: Message | null) => {
    setReplyToState(msg)
    setEditMsgState(null)
  }, [])

  const setEditMsg = useCallback((msg: Message | null) => {
    setEditMsgState(msg)
    setReplyToState(null)
  }, [])

  const openMedia = useCallback((url: string, type: 'photo' | 'video') => {
    setMediaViewer({ url, type })
  }, [])

  const closeMedia = useCallback(() => setMediaViewer(null), [])

  const clearInput = useCallback(() => clearFn?.(), [clearFn])
  const onClearInput = useCallback((fn: () => void) => setClearFn(() => fn), [])

  return (
    <ChatContext.Provider value={{
      replyTo, setReplyTo,
      editMsg, setEditMsg,
      forwardMsg, setForwardMsg,
      mediaViewer, openMedia, closeMedia,
      clearInput, onClearInput,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChatCtx = () => useContext(ChatContext)
