import { useEffect, useState } from 'react'
import type { ChatPermissions } from '@/api/chat'
import { chatApi } from '@/api/chat'

interface Props {
  chatId: string
  onBack: () => void
}

const PERMISSIONS: { key: keyof ChatPermissions; label: string; desc: string; icon: string }[] = [
  {
    key: 'can_send_messages',
    label: 'Отправка сообщений',
    desc: 'Участники могут писать в группе',
    icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  },
  {
    key: 'can_send_media',
    label: 'Отправка медиафайлов',
    desc: 'Фото, видео, файлы, голосовые',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    key: 'can_add_members',
    label: 'Добавление участников',
    desc: 'Участники могут приглашать других',
    icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  },
  {
    key: 'can_invite_users',
    label: 'Приглашение по ссылке',
    desc: 'Участники могут делиться ссылкой',
    icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  },
  {
    key: 'can_pin_messages',
    label: 'Закрепление сообщений',
    desc: 'Участники могут закреплять сообщения',
    icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
  },
  {
    key: 'can_change_info',
    label: 'Изменение информации',
    desc: 'Участники могут менять название и аватар',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
]

export function PermissionsPanel({ chatId, onBack }: Props) {
  const [perms, setPerms] = useState<ChatPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    chatApi.getPermissions(chatId)
      .then(({ data }) => setPerms(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [chatId])

  const toggle = (key: keyof ChatPermissions) => {
    if (!perms) return
    setPerms({ ...perms, [key]: !perms[key] })
    setDirty(true)
  }

  const handleSave = async () => {
    if (!perms || !dirty) return
    setSaving(true)
    try {
      await chatApi.updatePermissions(chatId, perms)
      setDirty(false)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const enabledCount = perms ? Object.values(perms).filter(Boolean).length : 0
  const totalCount = PERMISSIONS.length

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
        <span className="flex-1 font-semibold text-sm text-gray-900 dark:text-gray-100">Разрешения</span>
        {!loading && (
          <span className="text-xs text-gray-400 font-medium">{enabledCount}/{totalCount}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 leading-relaxed">
                Что могут делать обычные участники группы. Администраторы имеют все права.
              </p>
            </div>

            <div className="border-t border-black/5 dark:border-white/5">
              {PERMISSIONS.map(({ key, label, desc, icon }) => (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5
                    hover:bg-black/4 dark:hover:bg-white/4 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20
                    flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                    <p className="text-xs text-gray-400 truncate">{desc}</p>
                  </div>
                  {/* Toggle switch */}
                  <div className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    perms?.[key] ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow
                      transition-transform ${perms?.[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {dirty && (
        <div className="flex items-center justify-end gap-3 px-4 py-3
          border-t border-black/8 dark:border-white/8 flex-shrink-0">
          <button onClick={() => { setDirty(false); /* reload */ chatApi.getPermissions(chatId).then(({data}) => setPerms(data)).catch(() => {}) }}
            className="px-4 py-1.5 text-sm font-medium text-gray-500
              hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
            Отмена
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-1.5 text-sm font-medium text-white
              bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors disabled:opacity-40">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      )}
    </div>
  )
}
