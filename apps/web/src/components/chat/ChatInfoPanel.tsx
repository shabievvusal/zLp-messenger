import { useEffect, useState } from 'react'
import { addHours, addDays, addWeeks } from 'date-fns'
import type { Chat, ChatMember, Attachment, User } from '@/types'
import { chatApi } from '@/api/chat'
import { usersApi } from '@/api/users'
import { useChatStore } from '@/store/chat'
import { Avatar } from '@/components/ui/Avatar'
import { UserProfilePanel } from './UserProfilePanel'
import { mediaUrl } from '@/utils/media'

interface Props {
  chat: Chat
  onClose: () => void
  onCall: (type: 'voice' | 'video') => void
}

const MUTE_OPTIONS = [
  { label: '1 час', getUntil: () => addHours(new Date(), 1).toISOString() },
  { label: '8 часов', getUntil: () => addHours(new Date(), 8).toISOString() },
  { label: '1 день', getUntil: () => addDays(new Date(), 1).toISOString() },
  { label: '1 неделю', getUntil: () => addWeeks(new Date(), 1).toISOString() },
  { label: 'Навсегда', getUntil: () => '2099-01-01T00:00:00Z' },
]

export function ChatInfoPanel({ chat, onClose, onCall }: Props) {
  const isPrivate = chat.type === 'private'
  const isGroup = chat.type === 'group' || chat.type === 'channel'

  const [profile, setProfile] = useState<User | null>(null)
  const [members, setMembers] = useState<ChatMember[]>([])
  const [sharedMedia, setSharedMedia] = useState<Attachment[]>([])
  const [sharedFiles, setSharedFiles] = useState<Attachment[]>([])
  const [activeTab, setActiveTab] = useState<'media' | 'files'>('media')
  const [showMuteMenu, setShowMuteMenu] = useState(false)
  const [muteLoading, setMuteLoading] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  const mutedChats = useChatStore((s) => s.mutedChats)
  const setChatMuted = useChatStore((s) => s.setChatMuted)
  const isOnline = useChatStore((s) => s.isOnline)

  const mutedUntil = mutedChats[chat.id]
  const isMuted = !!mutedUntil && new Date(mutedUntil) > new Date()

  useEffect(() => {
    if (isPrivate && chat.peer_user_id) {
      usersApi.getById(chat.peer_user_id)
        .then(({ data }) => setProfile(data))
        .catch(() => {})
    }
    if (isGroup) {
      chatApi.getMembers(chat.id)
        .then(({ data }) => setMembers(data ?? []))
        .catch(() => {})
    }
    chatApi.getSharedMedia(chat.id, 'photo')
      .then(({ data }) => setSharedMedia(data ?? []))
      .catch(() => {})
    chatApi.getSharedMedia(chat.id, 'document')
      .then(({ data }) => setSharedFiles(data ?? []))
      .catch(() => {})
  }, [chat.id])

  const handleMute = async (until: string) => {
    setMuteLoading(true)
    try {
      await chatApi.muteChat(chat.id, until)
      setChatMuted(chat.id, until)
    } catch { /* ignore */ }
    finally { setMuteLoading(false); setShowMuteMenu(false) }
  }

  const handleUnmute = async () => {
    setMuteLoading(true)
    try {
      await chatApi.muteChat(chat.id, null)
      setChatMuted(chat.id, null)
    } catch { /* ignore */ }
    finally { setMuteLoading(false); setShowMuteMenu(false) }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const name = isPrivate && profile
    ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
    : chat.title ?? 'Чат'

  // If a member's profile is open — show nested panel
  if (selectedMemberId) {
    return (
      <UserProfilePanel
        userId={selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
        onCall={(type) => { onCall(type); setSelectedMemberId(null) }}
      />
    )
  }

  return (
    <>
      <div className="absolute inset-0 z-20" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-80 z-30
        bg-white/95 dark:bg-gray-800/95 backdrop-blur-md
        shadow-2xl border-l border-black/8 dark:border-white/8
        flex flex-col animate-slideInRight">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3
          border-b border-black/8 dark:border-white/8 flex-shrink-0">
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full
              hover:bg-black/8 dark:hover:bg-white/10 transition-colors active:scale-90">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Информация</span>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">

          {/* Hero */}
          <div className="flex flex-col items-center py-6 px-4 gap-3
            bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/10">
            <div className="relative">
              <Avatar name={name} url={isPrivate ? profile?.avatar_url : chat.avatar_url} size={80} />
              {isPrivate && chat.peer_user_id && isOnline(chat.peer_user_id) && (
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500
                  rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{name}</p>
              {isPrivate && profile?.username && (
                <p className="text-sm text-primary-500">@{profile.username}</p>
              )}
              {isPrivate && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {chat.peer_user_id && isOnline(chat.peer_user_id) ? 'в сети' : 'был(а) недавно'}
                </p>
              )}
              {isGroup && (
                <p className="text-xs text-gray-400 mt-0.5">{chat.members_count} участников</p>
              )}
            </div>

            {/* Action row */}
            <div className="flex items-center gap-2 mt-1">
              {isPrivate && (
                <>
                  <ActionBtn icon="📞" label="Звонок" onClick={() => { onCall('voice'); onClose() }} />
                  <ActionBtn icon="📹" label="Видео" onClick={() => { onCall('video'); onClose() }} />
                </>
              )}
              <div className="relative">
                <ActionBtn
                  icon={isMuted ? '🔕' : '🔔'}
                  label={isMuted ? 'Вкл. звук' : 'Выкл. звук'}
                  onClick={() => isMuted ? handleUnmute() : setShowMuteMenu((v) => !v)}
                  loading={muteLoading}
                />
                {showMuteMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMuteMenu(false)} />
                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50
                      bg-white dark:bg-gray-800 rounded-2xl shadow-2xl py-2 min-w-[160px]
                      border border-black/5 dark:border-white/5 animate-scaleIn origin-top">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest px-4 py-1.5 font-medium">
                        Выключить на...
                      </p>
                      {MUTE_OPTIONS.map((opt) => (
                        <button key={opt.label}
                          onClick={() => handleMute(opt.getUntil())}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                            hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Info: bio, username, description */}
          {isPrivate && profile?.bio && (
            <InfoRow label="О себе" value={profile.bio} />
          )}
          {isPrivate && profile?.username && (
            <InfoRow label="Имя пользователя" value={`@${profile.username}`} highlight />
          )}
          {isGroup && chat.description && (
            <InfoRow label="Описание" value={chat.description} />
          )}
          {isGroup && chat.username && (
            <InfoRow label="Ссылка" value={`@${chat.username}`} highlight />
          )}

          {/* Members (group only) */}
          {isGroup && members.length > 0 && (
            <div className="border-t border-black/5 dark:border-white/5 pt-1">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest px-4 py-2 font-medium">
                Участники ({members.length})
              </p>
              <div className="max-h-52 overflow-y-auto scrollbar-thin">
                {members.map((m) => {
                  const mName = m.user
                    ? `${m.user.first_name}${m.user.last_name ? ' ' + m.user.last_name : ''}`
                    : m.user_id
                  return (
                    <button key={m.user_id}
                      onClick={() => setSelectedMemberId(m.user_id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5
                        hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left">
                      <Avatar name={mName} url={m.user?.avatar_url} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{mName}</p>
                        {m.user?.username && (
                          <p className="text-xs text-gray-400 truncate">@{m.user.username}</p>
                        )}
                      </div>
                      {(m.role === 'owner' || m.role === 'admin') && (
                        <span className="text-[10px] font-medium text-primary-500
                          bg-primary-50 dark:bg-primary-900/20 rounded-full px-2 py-0.5 flex-shrink-0">
                          {m.role === 'owner' ? 'создатель' : 'админ'}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Shared media / files */}
          <div className="border-t border-black/5 dark:border-white/5 pt-1">
            {/* Tab bar */}
            <div className="flex px-4 gap-4 py-2">
              <TabBtn active={activeTab === 'media'} onClick={() => setActiveTab('media')}>
                Медиа {sharedMedia.length > 0 && `(${sharedMedia.length})`}
              </TabBtn>
              <TabBtn active={activeTab === 'files'} onClick={() => setActiveTab('files')}>
                Файлы {sharedFiles.length > 0 && `(${sharedFiles.length})`}
              </TabBtn>
            </div>

            {activeTab === 'media' && (
              sharedMedia.length === 0
                ? <p className="text-xs text-gray-400 px-4 pb-4">Нет медиафайлов</p>
                : (
                  <div className="grid grid-cols-3 gap-0.5 px-1 pb-4">
                    {sharedMedia.map((a) => (
                      <div key={a.id}
                        className="aspect-square overflow-hidden cursor-pointer rounded-sm
                          hover:opacity-90 transition-opacity">
                        <img
                          src={mediaUrl(a.thumbnail || a.url)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )
            )}

            {activeTab === 'files' && (
              sharedFiles.length === 0
                ? <p className="text-xs text-gray-400 px-4 pb-4">Нет файлов</p>
                : (
                  <div className="px-2 pb-4 space-y-1">
                    {sharedFiles.map((a) => (
                      <a key={a.id}
                        href={mediaUrl(a.url)}
                        download={a.file_name}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 px-2 py-2 rounded-xl
                          hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30
                          flex items-center justify-center flex-shrink-0 text-lg">
                          📄
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {a.file_name ?? 'Файл'}
                          </p>
                          <p className="text-xs text-gray-400">{formatFileSize(a.file_size ?? 0)}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )
            )}
          </div>

        </div>{/* end scrollable body */}
      </div>
    </>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="px-4 py-3 border-t border-black/5 dark:border-white/5">
      <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-medium">{label}</p>
      <p className={`text-sm leading-relaxed ${highlight ? 'text-primary-500 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
        {value}
      </p>
    </div>
  )
}

function ActionBtn({
  icon, label, onClick, loading,
}: { icon: string; label: string; onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl min-w-[64px]
        bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30
        active:scale-95 transition-all disabled:opacity-50">
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[10px] text-primary-500 font-medium leading-none">{label}</span>
    </button>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
        active
          ? 'border-primary-500 text-primary-500'
          : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
      }`}>
      {children}
    </button>
  )
}
