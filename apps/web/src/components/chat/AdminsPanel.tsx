import { useState } from 'react'
import type { ChatMember } from '@/types'
import { chatApi } from '@/api/chat'
import { useAuthStore } from '@/store/auth'
import { Avatar } from '@/components/ui/Avatar'

interface Props {
  chatId: string
  members: ChatMember[]
  onBack: () => void
  onMembersChanged: (members: ChatMember[]) => void
}

export function AdminsPanel({ chatId, members, onBack, onMembersChanged }: Props) {
  const currentUser = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState<string | null>(null)

  const admins = members.filter((m) => m.role === 'owner' || m.role === 'admin')
  const regularMembers = members.filter((m) => m.role === 'member' || m.role === 'restricted')

  const myRole = members.find((m) => m.user_id === currentUser?.id)?.role
  const isOwner = myRole === 'owner'

  const handlePromote = async (userId: string) => {
    setLoading(userId)
    try {
      await chatApi.setMemberRole(chatId, userId, 'admin')
      onMembersChanged(members.map((m) =>
        m.user_id === userId ? { ...m, role: 'admin' } : m
      ))
    } catch { /* ignore */ }
    finally { setLoading(null) }
  }

  const handleDemote = async (userId: string) => {
    setLoading(userId)
    try {
      await chatApi.setMemberRole(chatId, userId, 'member')
      onMembersChanged(members.map((m) =>
        m.user_id === userId ? { ...m, role: 'member' } : m
      ))
    } catch { /* ignore */ }
    finally { setLoading(null) }
  }

  const memberName = (m: ChatMember) =>
    m.user ? `${m.user.first_name}${m.user.last_name ? ' ' + m.user.last_name : ''}` : m.user_id

  return (
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
        <span className="flex-1 font-semibold text-sm text-gray-900 dark:text-gray-100">
          Администраторы
        </span>
        <span className="text-xs text-gray-400 font-medium">{admins.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Admins list */}
        {admins.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium px-4 py-2.5">
              Администраторы
            </p>
            {admins.map((m) => {
              const name = memberName(m)
              const isMe = m.user_id === currentUser?.id
              return (
                <div key={m.user_id} className="flex items-center gap-3 px-4 py-2.5 group">
                  <Avatar name={name} url={m.user?.avatar_url} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {name}{isMe ? ' (вы)' : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {m.role === 'owner' ? 'Создатель' : m.title ?? 'Администратор'}
                    </p>
                  </div>
                  {isOwner && !isMe && m.role === 'admin' && (
                    <button
                      onClick={() => handleDemote(m.user_id)}
                      disabled={loading === m.user_id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity
                        text-xs font-medium text-red-500 px-2 py-1 rounded-lg
                        hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 flex-shrink-0">
                      {loading === m.user_id ? '...' : 'Снять'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Promote members section (owner only) */}
        {isOwner && regularMembers.length > 0 && (
          <div className="border-t border-black/5 dark:border-white/5 mt-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium px-4 py-2.5">
              Назначить администратора
            </p>
            {regularMembers.map((m) => {
              const name = memberName(m)
              return (
                <div key={m.user_id} className="flex items-center gap-3 px-4 py-2.5 group">
                  <Avatar name={name} url={m.user?.avatar_url} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</p>
                    {m.user?.username && (
                      <p className="text-xs text-gray-400 truncate">@{m.user.username}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handlePromote(m.user_id)}
                    disabled={loading === m.user_id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity
                      text-xs font-medium text-primary-500 px-2 py-1 rounded-lg
                      hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-40 flex-shrink-0">
                    {loading === m.user_id ? '...' : 'Назначить'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {admins.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">Нет администраторов</p>
        )}
      </div>
    </div>
  )
}
