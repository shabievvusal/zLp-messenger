import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatApi } from '@/api/chat'
import { usersApi } from '@/api/users'
import { useChatStore } from '@/store/chat'
import { Avatar } from '@/components/ui/Avatar'
import type { User } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  onClose: () => void
}

export function NewChatModal({ onClose }: Props) {
  const navigate = useNavigate()
  const upsertChat = useChatStore((s) => s.upsertChat)
  const setActiveChat = useChatStore((s) => s.setActiveChat)

  const [tab, setTab] = useState<'private' | 'group'>('private')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [groupTitle, setGroupTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Debounced user search
  useEffect(() => {
    clearTimeout(timerRef.current)
    if (query.length < 2) { setResults([]); return }
    setSearching(true)
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await usersApi.search(query)
        setResults(data ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  const openPrivateChat = async (user: User) => {
    setLoading(true)
    try {
      const { data } = await chatApi.createPrivate(user.id)
      upsertChat(data)
      setActiveChat(data.id)
      navigate(`/chat/${data.id}`)
      onClose()
    } catch {
      toast.error('Failed to open chat')
    } finally {
      setLoading(false)
    }
  }

  const handleGroup = async () => {
    if (!groupTitle.trim()) return
    setLoading(true)
    try {
      const { data } = await chatApi.createGroup({ title: groupTitle })
      upsertChat(data)
      setActiveChat(data.id)
      navigate(`/chat/${data.id}`)
      onClose()
    } catch {
      toast.error('Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">New Chat</h2>

          {/* Tabs */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            {(['private', 'group'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                  tab === t
                    ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t === 'private' ? '👤 Private' : '👥 Group'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'private' ? (
          <div>
            {/* Search input */}
            <div className="px-6 pb-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by username or name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600
                    rounded-lg bg-white dark:bg-gray-700 text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
                    border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              {query.length >= 2 && results.length === 0 && !searching && (
                <p className="text-center text-gray-400 text-sm py-8">No users found</p>
              )}
              {query.length < 2 && (
                <p className="text-center text-gray-400 text-sm py-8">Type at least 2 characters</p>
              )}
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => openPrivateChat(user)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-6 py-3
                    hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                >
                  <Avatar name={`${user.first_name} ${user.last_name ?? ''}`} url={user.avatar_url} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-3">
            <input
              type="text"
              placeholder="Group name"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleGroup}
              disabled={loading || !groupTitle.trim()}
              className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium
                hover:bg-primary-700 disabled:opacity-50 transition"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        )}

        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
