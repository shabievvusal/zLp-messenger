import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { AdminAction } from '@/api/chat'
import { chatApi } from '@/api/chat'
import { Avatar } from '@/components/ui/Avatar'

interface Props {
  chatId: string
  onBack: () => void
}

const ACTION_LABELS: Record<string, string> = {
  promote: 'назначил администратором',
  demote: 'снял с должности администратора',
  kick: 'исключил',
  ban: 'заблокировал',
  change_title: 'изменил название группы',
  change_avatar: 'изменил аватар группы',
  pin_message: 'закрепил сообщение',
  unpin_message: 'открепил сообщение',
  delete_message: 'удалил сообщение',
}

export function AdminActionsPanel({ chatId, onBack }: Props) {
  const [actions, setActions] = useState<AdminAction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chatApi.getAdminActions(chatId)
      .then(({ data }) => setActions(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [chatId])

  const userName = (u?: { first_name: string; last_name?: string; username: string }) =>
    u ? `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}` : 'Пользователь'

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
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Недавние действия</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <svg className="w-12 h-12 text-gray-200 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Нет недавних действий</p>
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {actions.map((a) => {
              const actorName = userName(a.actor)
              const targetName = a.target ? userName(a.target) : null
              const label = ACTION_LABELS[a.action] ?? a.action
              return (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <Avatar
                    name={actorName}
                    url={a.actor?.avatar_url}
                    size={36}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                      <span className="font-medium">{actorName}</span>
                      {' '}{label}
                      {targetName && (
                        <> <span className="font-medium text-primary-500">{targetName}</span></>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ru })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
