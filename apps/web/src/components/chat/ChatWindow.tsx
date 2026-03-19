import { useEffect, useRef, useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useChatStore } from '@/store/chat'
import { chatApi } from '@/api/chat'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { MediaViewer } from './MediaViewer'
import { ChatProvider } from '@/contexts/ChatContext'

const PAGE_SIZE = 50

export function ChatWindow() {
  const { chatId } = useParams<{ chatId: string }>()
  const { setMessages, prependMessages, clearUnread, chats } = useChatStore()
  const chat = chats.find((c) => c.id === chatId)
  const prevChatId = useRef<string>()
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loadingMore = useRef(false)

  const loadMessages = useCallback(async (id: string, off = 0) => {
    try {
      const { data } = await chatApi.getMessages(id, PAGE_SIZE, off)
      const sorted = [...data].reverse()
      if (off === 0) {
        setMessages(id, sorted)
      } else {
        prependMessages(id, sorted)
      }
      if (data.length < PAGE_SIZE) setHasMore(false)
      clearUnread(id)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!chatId || chatId === prevChatId.current) return
    prevChatId.current = chatId
    setOffset(0)
    setHasMore(true)
    loadMessages(chatId, 0)
  }, [chatId])

  const handleLoadMore = useCallback(async () => {
    if (!chatId || !hasMore || loadingMore.current) return
    loadingMore.current = true
    const newOffset = offset + PAGE_SIZE
    setOffset(newOffset)
    await loadMessages(chatId, newOffset)
    loadingMore.current = false
  }, [chatId, offset, hasMore])

  if (!chatId || !chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Chat not found
      </div>
    )
  }

  return (
    <ChatProvider>
      <div className="flex flex-col h-full bg-chat dark:bg-chat-dark">
        <ChatHeader chat={chat} />
        <MessageList chatId={chatId} onLoadMore={handleLoadMore} />
        <MessageInput chatId={chatId} />
      </div>
      <MediaViewer />
    </ChatProvider>
  )
}
