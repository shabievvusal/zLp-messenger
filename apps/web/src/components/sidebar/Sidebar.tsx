import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useChatStore } from '@/store/chat'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api/auth'
import { ChatItem } from './ChatItem'
import { SearchBar } from './SearchBar'
import { NewChatModal } from './NewChatModal'
import { Avatar } from '@/components/ui/Avatar'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const chats = useChatStore((s) => s.chats)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const setActiveChat = useChatStore((s) => s.setActiveChat)
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const filtered = search
    ? chats.filter((c) =>
        (c.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.username ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : chats

  const handleSelect = (chatId: string) => {
    setActiveChat(chatId)
    navigate(`/chat/${chatId}`)
  }

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    logout()
    navigate('/login')
  }

  const totalUnread = chats.reduce((sum, c) => sum + (c.unread_count ?? 0), 0)

  return (
    <aside className="w-[340px] flex-shrink-0 flex flex-col
      border-r border-gray-200 dark:border-gray-700
      bg-sidebar dark:bg-sidebar-dark h-full">

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2
        border-b border-gray-200 dark:border-gray-700">

        {/* Avatar + menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="rounded-full focus:outline-none"
          >
            <Avatar
              name={`${user?.first_name ?? '?'} ${user?.last_name ?? ''}`}
              url={user?.avatar_url}
              size={36}
            />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute left-0 top-10 z-50 bg-white dark:bg-gray-800
                shadow-xl rounded-2xl py-2 min-w-[200px]
                border border-gray-100 dark:border-gray-700">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">@{user?.username}</p>
                </div>
                <SideMenuItem icon="⚙️" label="Settings" onClick={() => { navigate('/settings'); setShowMenu(false) }} />
                <SideMenuItem icon="💾" label="Saved Messages" onClick={() => setShowMenu(false)} />
                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                <SideMenuItem icon="🚪" label="Log Out" onClick={handleLogout} danger />
              </div>
            </>
          )}
        </div>

        {/* Title */}
        <span className="font-semibold text-sm flex-1 text-gray-900 dark:text-gray-100">
          ZLP Messenger
          {totalUnread > 0 && (
            <span className="ml-2 text-xs bg-primary-500 text-white rounded-full px-1.5 py-0.5">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </span>

        {/* New chat */}
        <button
          onClick={() => setShowNewChat(true)}
          className="icon-btn"
          title="New chat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-sm">{search ? 'No chats found' : 'No chats yet'}</p>
            {!search && (
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-2 text-sm text-primary-500 hover:underline"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          filtered.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              active={chat.id === activeChatId}
              onClick={() => handleSelect(chat.id)}
            />
          ))
        )}
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </aside>
  )
}

function SideMenuItem({ icon, label, onClick, danger }: {
  icon: string; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition
        ${danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  )
}
