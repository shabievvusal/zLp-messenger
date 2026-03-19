import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatApi } from '@/api/chat'
import { usersApi } from '@/api/users'
import { useChatStore } from '@/store/chat'
import { useAuthStore } from '@/store/auth'
import { Avatar } from '@/components/ui/Avatar'
import { mediaUrl } from '@/utils/media'
import type { User } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  onClose: () => void
  initialMode?: 'private' | 'group'
}

export function NewChatModal({ onClose, initialMode = 'private' }: Props) {
  if (initialMode === 'group') {
    return <CreateGroupFlow onClose={onClose} />
  }
  return <NewPrivateChat onClose={onClose} onSwitchToGroup={() => {}} />
}

// ── Private chat search ─────────────────────────────────────

function NewPrivateChat({ onClose }: { onClose: () => void; onSwitchToGroup: () => void }) {
  const navigate = useNavigate()
  const upsertChat = useChatStore((s) => s.upsertChat)
  const setActiveChat = useChatStore((s) => s.setActiveChat)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (query.length < 2) { setResults([]); return }
    setSearching(true)
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await usersApi.search(query)
        setResults(data ?? [])
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  const open = async (user: User) => {
    setLoading(true)
    try {
      const { data } = await chatApi.createPrivate(user.id)
      upsertChat({
        ...data,
        title: data.title || `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`,
        peer_user_id: data.peer_user_id || user.id,
        avatar_url: data.avatar_url || user.avatar_url,
      })
      setActiveChat(data.id)
      navigate(`/chat/${data.id}`)
      onClose()
    } catch { toast.error('Не удалось открыть чат') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Новый чат</h2>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input autoFocus type="text" placeholder="Поиск по имени или @username..."
              value={query} onChange={(e) => setQuery(e.target.value)}
              className="input-base pl-9 text-sm" />
            {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 spinner border-primary-500" />}
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto scrollbar-thin">
          {query.length < 2
            ? <p className="text-center text-gray-400 text-sm py-8">Введите минимум 2 символа</p>
            : results.length === 0 && !searching
              ? <p className="text-center text-gray-400 text-sm py-8">Пользователи не найдены</p>
              : results.map((user) => (
                <button key={user.id} onClick={() => open(user)} disabled={loading}
                  className="w-full flex items-center gap-3 px-6 py-3
                    hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left">
                  <Avatar name={`${user.first_name} ${user.last_name ?? ''}`}
                    url={user.avatar_url ? mediaUrl(user.avatar_url) : null} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                  </div>
                </button>
              ))
          }
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600
            dark:hover:text-gray-300 transition-colors">Отмена</button>
        </div>
      </div>
    </div>
  )
}

// ── Create group flow ───────────────────────────────────────

function CreateGroupFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'members' | 'name'>('members')
  const [selected, setSelected] = useState<User[]>([])

  if (step === 'name') {
    return (
      <GroupNameStep
        selected={selected}
        onBack={() => setStep('members')}
        onClose={onClose}
      />
    )
  }

  return (
    <AddMembersStep
      selected={selected}
      onToggle={(user) =>
        setSelected((prev) =>
          prev.find((u) => u.id === user.id)
            ? prev.filter((u) => u.id !== user.id)
            : [...prev, user]
        )
      }
      onNext={() => setStep('name')}
      onClose={onClose}
    />
  )
}

// ── Step 1: Add members ─────────────────────────────────────

function AddMembersStep({ selected, onToggle, onNext, onClose }: {
  selected: User[]
  onToggle: (u: User) => void
  onNext: () => void
  onClose: () => void
}) {
  const chats = useChatStore((s) => s.chats)
  const currentUser = useAuthStore((s) => s.user)
  const isOnline = useChatStore((s) => s.isOnline)
  const [query, setQuery] = useState('')
  const [contacts, setContacts] = useState<User[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Load contacts from private chats
  useEffect(() => {
    const privateChats = chats.filter((c) => c.type === 'private' && c.peer_user_id)
    const ids = [...new Set(privateChats.map((c) => c.peer_user_id!))]
      .filter((id) => id !== currentUser?.id)
    if (ids.length === 0) return
    Promise.all(ids.map((id) => usersApi.getById(id).then((r) => r.data).catch(() => null)))
      .then((users) => setContacts(users.filter(Boolean) as User[]))
  }, [chats, currentUser?.id])

  // Search
  useEffect(() => {
    clearTimeout(timerRef.current)
    if (query.length < 2) { setSearchResults([]); return }
    setSearching(true)
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await usersApi.search(query)
        setSearchResults(data ?? [])
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  const displayed = query.length >= 2 ? searchResults : contacts

  const lastSeen = (user: User) => {
    if (isOnline(user.id)) return <span className="text-green-500 text-xs">в сети</span>
    if (!user.last_seen) return <span className="text-xs text-gray-400">был(а) недавно</span>
    const diff = Date.now() - new Date(user.last_seen).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 5) return <span className="text-xs text-gray-400">был(а) только что</span>
    if (mins < 60) return <span className="text-xs text-gray-400">был(а) {mins} мин назад</span>
    const hours = Math.floor(mins / 60)
    if (hours < 24) return <span className="text-xs text-gray-400">был(а) {hours} ч назад</span>
    return <span className="text-xs text-gray-400">был(а) недавно</span>
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#1c1c1e] animate-slideInRight">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3
        border-b border-black/8 dark:border-white/8
        bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md shadow-sm flex-shrink-0">
        <button onClick={onClose} className="icon-btn">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Добавить участников</h2>
          {selected.length > 0 && (
            <p className="text-xs text-primary-500">{selected.length} выбрано</p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 flex-shrink-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Кого бы Вы хотели пригласить?</p>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Поиск..."
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="input-base pl-9 text-sm" />
          {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 spinner border-primary-500" />}
        </div>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide flex-shrink-0">
          {selected.map((u) => (
            <button key={u.id} onClick={() => onToggle(u)}
              className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="relative">
                <Avatar name={`${u.first_name} ${u.last_name ?? ''}`}
                  url={u.avatar_url ? mediaUrl(u.avatar_url) : null} size={44} />
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gray-500
                  flex items-center justify-center text-white text-[10px]">✕</div>
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 max-w-[48px] truncate">
                {u.first_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {displayed.length === 0 && query.length < 2 && (
          <p className="text-center text-gray-400 text-sm py-12">Нет контактов</p>
        )}
        {displayed.length === 0 && query.length >= 2 && !searching && (
          <p className="text-center text-gray-400 text-sm py-12">Ничего не найдено</p>
        )}
        {displayed.map((user) => {
          const isSelected = !!selected.find((u) => u.id === user.id)
          return (
            <button key={user.id} onClick={() => onToggle(user)}
              className="w-full flex items-center gap-3 px-4 py-3
                hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left">
              <Avatar name={`${user.first_name} ${user.last_name ?? ''}`}
                url={user.avatar_url ? mediaUrl(user.avatar_url) : null} size={48} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                  {user.first_name}{user.last_name ? ' ' + user.last_name : ''}
                </p>
                {lastSeen(user)}
              </div>
              {/* Checkbox */}
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0
                border-2 transition-all ${isSelected
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-gray-300 dark:border-gray-600'}`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Floating next button */}
      {selected.length > 0 && (
        <button onClick={onNext}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full
            bg-primary-500 hover:bg-primary-600 active:scale-95
            flex items-center justify-center shadow-xl shadow-primary-500/40
            transition-all animate-popIn">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ── Step 2: Group name ──────────────────────────────────────

function GroupNameStep({ selected, onBack, onClose }: {
  selected: User[]
  onBack: () => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const upsertChat = useChatStore((s) => s.upsertChat)
  const setActiveChat = useChatStore((s) => s.setActiveChat)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const { data } = await chatApi.createGroup({
        title,
        member_ids: selected.map((u) => u.id),
      })
      upsertChat({ ...data, members_count: selected.length + 1 })
      setActiveChat(data.id)
      navigate(`/chat/${data.id}`)
      onClose()
    } catch { toast.error('Не удалось создать группу') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#1c1c1e] animate-slideInRight">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3
        border-b border-black/8 dark:border-white/8
        bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md shadow-sm flex-shrink-0">
        <button onClick={onBack} className="icon-btn">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Название группы</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Group icon placeholder */}
        <div className="flex flex-col items-center py-8 gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700
            flex items-center justify-center text-3xl text-gray-400">
            📷
          </div>
          <input
            autoFocus
            type="text"
            placeholder="Название группы"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="input-base text-sm max-w-xs w-full mx-auto text-center"
          />
        </div>

        {/* Selected members preview */}
        <div className="px-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-medium">
            Участники ({selected.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {selected.map((u) => (
              <div key={u.id} className="flex flex-col items-center gap-1">
                <Avatar name={`${u.first_name} ${u.last_name ?? ''}`}
                  url={u.avatar_url ? mediaUrl(u.avatar_url) : null} size={44} />
                <span className="text-[10px] text-gray-500 dark:text-gray-400 max-w-[52px] truncate">
                  {u.first_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create button */}
      {title.trim().length > 0 && (
        <button onClick={handleCreate} disabled={loading}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full
            bg-primary-500 hover:bg-primary-600 active:scale-95
            flex items-center justify-center shadow-xl shadow-primary-500/40
            transition-all animate-popIn disabled:opacity-50">
          {loading
            ? <div className="spinner border-white" />
            : <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
          }
        </button>
      )}
    </div>
  )
}
