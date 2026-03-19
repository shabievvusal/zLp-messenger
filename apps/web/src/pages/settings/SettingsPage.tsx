import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { api } from '@/api/client'
import { Avatar } from '@/components/ui/Avatar'
import { useDarkMode } from '@/hooks/useDarkMode'
import { mediaUrl } from '@/utils/media'
import toast from 'react-hot-toast'

type Section = 'profile' | 'general' | 'notifications' | 'privacy' | 'sessions' | 'sound' | null

export function SettingsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<Section>(null)

  if (activeSection === 'profile') {
    return <ProfileEdit onBack={() => setActiveSection(null)} />
  }
  if (activeSection === 'general') {
    return <GeneralSettings onBack={() => setActiveSection(null)} />
  }
  if (activeSection === 'notifications') {
    return <NotificationSettings onBack={() => setActiveSection(null)} />
  }
  if (activeSection === 'sessions') {
    return <SessionsSettings onBack={() => setActiveSection(null)} />
  }
  if (activeSection === 'sound') {
    return <SoundCameraSettings onBack={() => setActiveSection(null)} />
  }

  return <SettingsMenu onSection={setActiveSection} onBack={() => navigate('/')} />
}

// ── Main menu ───────────────────────────────────────────────

function SettingsMenu({ onSection, onBack }: { onSection: (s: Section) => void; onBack: () => void }) {
  const user = useAuthStore((s) => s.user)
  const name = `${user?.first_name ?? ''}${user?.last_name ? ' ' + user.last_name : ''}`

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1c1c1e] animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3
        bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md
        border-b border-black/8 dark:border-white/8 shadow-sm">
        <button onClick={onBack} className="icon-btn active:scale-90">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-gray-100">Настройки</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">

        {/* Profile card */}
        <button
          onClick={() => onSection('profile')}
          className="w-full flex items-center gap-4 px-5 py-4
            hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
        >
          <Avatar
            name={name || '?'}
            url={user?.avatar_url ? mediaUrl(user.avatar_url) : null}
            size={64}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">{name}</p>
            {user?.bio && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{user.bio}</p>
            )}
            {user?.username && (
              <p className="text-sm text-primary-500 mt-0.5">@{user.username}</p>
            )}
          </div>
          <ChevronRight />
        </button>

        <Divider />

        {/* Settings sections */}
        <SettingsGroup>
          <SettingsRow
            icon={<IcGeneral />}
            label="Общие настройки"
            onClick={() => onSection('general')}
          />
          <SettingsRow
            icon={<IcAnimations />}
            label="Анимации и скорость"
            onClick={() => toast('Скоро', { icon: '🚧' })}
          />
          <SettingsRow
            icon={<IcNotifications />}
            label="Уведомления"
            onClick={() => onSection('notifications')}
          />
          <SettingsRow
            icon={<IcSound />}
            label="Звук и камера"
            onClick={() => onSection('sound')}
          />
          <SettingsRow
            icon={<IcData />}
            label="Данные и память"
            onClick={() => toast('Скоро', { icon: '🚧' })}
          />
        </SettingsGroup>

        <Divider />

        <SettingsGroup>
          <SettingsRow
            icon={<IcPrivacy />}
            label="Конфиденциальность"
            onClick={() => toast('Скоро', { icon: '🚧' })}
          />
          <SettingsRow
            icon={<IcFolders />}
            label="Папки с чатами"
            onClick={() => toast('Скоро', { icon: '🚧' })}
          />
          <SettingsRow
            icon={<IcSessions />}
            label="Активные сеансы"
            badge="1"
            onClick={() => onSection('sessions')}
          />
        </SettingsGroup>

        <Divider />

        <SettingsGroup>
          <SettingsRow
            icon={<IcLanguage />}
            label="Язык"
            value="Русский"
            onClick={() => toast('Скоро', { icon: '🚧' })}
          />
          <SettingsRow
            icon={<IcStickers />}
            label="Стикеры и эмодзи"
            onClick={() => toast('Скоро', { icon: '🚧' })}
          />
        </SettingsGroup>

        <div className="h-8" />
      </div>
    </div>
  )
}

// ── Profile edit ────────────────────────────────────────────

function ProfileEdit({ onBack }: { onBack: () => void }) {
  const { user, setAuth, accessToken } = useAuthStore()
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    bio: user?.bio ?? '',
    username: user?.username ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.patch('/users/me', form)
      setAuth(data, accessToken!)
      toast.success('Профиль обновлён')
      onBack()
    } catch {
      toast.error('Не удалось обновить профиль')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data } = await api.post('/media/avatar', formData)
      if (user) setAuth({ ...user, avatar_url: data.avatar_url }, accessToken!)
      toast.success('Аватар обновлён')
    } catch {
      toast.error('Не удалось загрузить аватар')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const name = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1c1c1e] animate-fadeIn">
      <div className="flex items-center gap-3 px-4 py-3
        bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md
        border-b border-black/8 dark:border-white/8 shadow-sm">
        <button onClick={onBack} className="icon-btn active:scale-90">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-gray-100">Мой профиль</h1>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-medium text-primary-500 hover:text-primary-600
            disabled:opacity-50 transition-colors"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Avatar */}
        <div className="flex flex-col items-center py-8
          bg-gradient-to-b from-primary-50/60 to-transparent
          dark:from-primary-900/10 dark:to-transparent">
          <div className="relative cursor-pointer group" onClick={() => fileRef.current?.click()}>
            <Avatar name={name} url={user?.avatar_url ? mediaUrl(user.avatar_url) : null} size={96} />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center
              justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingAvatar
                ? <div className="spinner border-white" />
                : <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
              }
            </div>
          </div>
          <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          <p className="mt-3 text-xs text-gray-400">Нажмите, чтобы изменить фото</p>
        </div>

        <div className="px-4 pb-6 space-y-3 max-w-md mx-auto w-full">
          {[
            { label: 'Имя', key: 'first_name', required: true },
            { label: 'Фамилия', key: 'last_name' },
            { label: 'Имя пользователя', key: 'username', required: true, prefix: '@' },
            { label: 'О себе', key: 'bio', multiline: true },
          ].map(({ label, key, required, prefix, multiline }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                {label} {required && <span className="text-red-400">*</span>}
              </label>
              {multiline ? (
                <textarea
                  value={form[key as keyof typeof form]}
                  onChange={(e) => update(key, e.target.value)}
                  rows={3}
                  placeholder={`${label}...`}
                  className="input-base resize-none"
                />
              ) : (
                <div className="relative">
                  {prefix && (
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">{prefix}</span>
                  )}
                  <input
                    type="text"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => update(key, e.target.value)}
                    className={`input-base ${prefix ? 'pl-7' : ''}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── General settings ────────────────────────────────────────

function GeneralSettings({ onBack }: { onBack: () => void }) {
  const { isDark, toggle } = useDarkMode()

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1c1c1e] animate-fadeIn">
      <div className="flex items-center gap-3 px-4 py-3
        bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md
        border-b border-black/8 dark:border-white/8 shadow-sm">
        <button onClick={onBack} className="icon-btn active:scale-90">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-gray-100">Общие настройки</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
        <SettingsGroup>
          <ToggleRow
            icon={<IcMoon />}
            label="Ночной режим"
            checked={isDark}
            onChange={toggle}
          />
        </SettingsGroup>
      </div>
    </div>
  )
}

// ── Notifications ───────────────────────────────────────────

function NotificationSettings({ onBack }: { onBack: () => void }) {
  const [enabled, setEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  )

  const handleToggle = async () => {
    if (!enabled) {
      const perm = await Notification.requestPermission()
      setEnabled(perm === 'granted')
      if (perm !== 'granted') toast.error('Браузер запретил уведомления')
    } else {
      setEnabled(false)
      toast('Чтобы полностью отключить, запретите уведомления в браузере', { icon: 'ℹ️' })
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1c1c1e] animate-fadeIn">
      <div className="flex items-center gap-3 px-4 py-3
        bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md
        border-b border-black/8 dark:border-white/8 shadow-sm">
        <button onClick={onBack} className="icon-btn active:scale-90">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-gray-100">Уведомления</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
        <SettingsGroup>
          <ToggleRow
            icon={<IcNotifications />}
            label="Push-уведомления"
            checked={enabled}
            onChange={handleToggle}
          />
        </SettingsGroup>
        <p className="text-xs text-gray-400 px-5 mt-2">
          Получайте уведомления о новых сообщениях даже когда вкладка не активна.
        </p>
      </div>
    </div>
  )
}

// ── Sessions ────────────────────────────────────────────────

function SessionsSettings({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1c1c1e] animate-fadeIn">
      <div className="flex items-center gap-3 px-4 py-3
        bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md
        border-b border-black/8 dark:border-white/8 shadow-sm">
        <button onClick={onBack} className="icon-btn active:scale-90">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-gray-100">Активные сеансы</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
        <SettingsGroup>
          <div className="flex items-center gap-4 px-5 py-3.5">
            <span className="text-primary-500"><IcSessions /></span>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Текущий сеанс</p>
              <p className="text-xs text-gray-400 mt-0.5">Веб-браузер · Активен сейчас</p>
            </div>
            <span className="ml-auto text-xs text-green-500 font-medium">Активен</span>
          </div>
        </SettingsGroup>
      </div>
    </div>
  )
}

// ── UI helpers ──────────────────────────────────────────────

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#2c2c2e] mx-4 rounded-2xl overflow-hidden shadow-sm
      border border-black/5 dark:border-white/5">
      {children}
    </div>
  )
}

function Divider() {
  return <div className="h-4" />
}

function SettingsRow({ icon, label, value, badge, onClick }: {
  icon: React.ReactNode
  label: string
  value?: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-3.5
        hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left
        border-b border-black/5 dark:border-white/5 last:border-0"
    >
      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
      {value && <span className="text-sm text-gray-400 dark:text-gray-500">{value}</span>}
      {badge && (
        <span className="min-w-[20px] h-5 px-1.5 bg-primary-500 text-white text-xs
          font-semibold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
      <ChevronRight />
    </button>
  )
}

function ToggleRow({ icon, label, checked, onChange }: {
  icon: React.ReactNode
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div
      onClick={onChange}
      className="flex items-center gap-4 px-5 py-3.5 cursor-pointer
        hover:bg-black/5 dark:hover:bg-white/5 transition-colors
        border-b border-black/5 dark:border-white/5 last:border-0"
    >
      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
      <div className={`w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
        ${checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </div>
  )
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

// ── Section icons ───────────────────────────────────────────

function IcGeneral() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
}

function IcAnimations() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
}

function IcNotifications() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
}

function IcData() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
}

function IcPrivacy() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
}

function IcFolders() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
}

function IcSessions() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
}

function IcLanguage() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
  </svg>
}

function IcStickers() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
}

function IcMoon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
}

function IcSound() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-4-4m4 4l4-4M9.172 16.172a4 4 0 010-5.656M5.636 12.364a9 9 0 0112.728 0" />
  </svg>
}

// ── Helpers for persisting media device selections ───────────

const MEDIA_SETTINGS_KEY = 'zlp_media_devices'

function loadMediaSettings() {
  try {
    return JSON.parse(localStorage.getItem(MEDIA_SETTINGS_KEY) ?? '{}') as Record<string, string>
  } catch { return {} }
}

function saveMediaSetting(key: string, value: string) {
  const current = loadMediaSettings()
  localStorage.setItem(MEDIA_SETTINGS_KEY, JSON.stringify({ ...current, [key]: value }))
}

// ── Sound & Camera settings ──────────────────────────────────

function SoundCameraSettings({ onBack }: { onBack: () => void }) {
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([])
  const [audioInputs, setAudioInputs]   = useState<MediaDeviceInfo[]>([])
  const [videoInputs, setVideoInputs]   = useState<MediaDeviceInfo[]>([])

  const saved = loadMediaSettings()
  const [selectedOutput, setSelectedOutput] = useState(saved.audioOutput ?? 'default')
  const [selectedInput,  setSelectedInput]  = useState(saved.audioInput  ?? 'default')
  const [selectedCamera, setSelectedCamera] = useState(saved.videoInput  ?? 'default')

  const [useForCalls, setUseForCalls]       = useState(true)
  const [acceptCalls, setAcceptCalls]       = useState(true)
  const [micLevel, setMicLevel]             = useState(0)

  const videoRef    = useRef<HTMLVideoElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const animRef     = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)

  // Enumerate devices
  useEffect(() => {
    async function enumerate() {
      try {
        // Request permissions first so labels are visible
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      } catch { /* ignore — list may still populate without labels */ }
      const devices = await navigator.mediaDevices.enumerateDevices()
      setAudioOutputs(devices.filter((d) => d.kind === 'audiooutput'))
      setAudioInputs(devices.filter((d) => d.kind === 'audioinput'))
      setVideoInputs(devices.filter((d) => d.kind === 'videoinput'))
    }
    enumerate()
    return () => {
      stopCamera()
      stopMic()
    }
  }, [])

  // Camera preview
  useEffect(() => {
    stopCamera()
    if (!selectedCamera) return
    navigator.mediaDevices.getUserMedia({
      video: selectedCamera === 'default'
        ? true
        : { deviceId: { exact: selectedCamera } },
    }).then((stream) => {
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
    }).catch(() => {})
  }, [selectedCamera])

  // Mic level meter
  useEffect(() => {
    stopMic()
    navigator.mediaDevices.getUserMedia({
      audio: selectedInput === 'default'
        ? true
        : { deviceId: { exact: selectedInput } },
    }).then((stream) => {
      micStreamRef.current = stream
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setMicLevel(Math.min(100, (avg / 128) * 100))
        animRef.current = requestAnimationFrame(tick)
      }
      animRef.current = requestAnimationFrame(tick)
    }).catch(() => {})
    return () => { cancelAnimationFrame(animRef.current) }
  }, [selectedInput])

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }
  function stopMic() {
    cancelAnimationFrame(animRef.current)
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
  }

  const deviceLabel = (d: MediaDeviceInfo) =>
    d.label || (d.kind === 'audiooutput' ? 'Динамик' : d.kind === 'audioinput' ? 'Микрофон' : 'Камера')

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1c1c1e] animate-fadeIn">
      <div className="flex items-center gap-3 px-4 py-3
        bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md
        border-b border-black/8 dark:border-white/8 shadow-sm">
        <button onClick={onBack} className="icon-btn active:scale-90">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-gray-100">Звук и камера</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-4 space-y-4">

        {/* ── Speakers ── */}
        <SoundSection label="Колонки и наушники">
          <DeviceRow
            label="Устройство воспроизведения"
            value={selectedOutput}
            onChange={(v) => { setSelectedOutput(v); saveMediaSetting('audioOutput', v) }}
            devices={audioOutputs}
          />
        </SoundSection>

        {/* ── Microphone ── */}
        <SoundSection label="Микрофон">
          <DeviceRow
            label="Устройство записи"
            value={selectedInput}
            onChange={(v) => { setSelectedInput(v); saveMediaSetting('audioInput', v) }}
            devices={audioInputs}
          />
          {/* Level meter */}
          <div className="px-5 pb-4">
            <div className="flex gap-[2px] h-5 items-end">
              {Array.from({ length: 32 }).map((_, i) => {
                const threshold = (i / 32) * 100
                const active = micLevel > threshold
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-all duration-75 ${
                      active
                        ? i < 20 ? 'bg-primary-500' : i < 28 ? 'bg-yellow-400' : 'bg-red-500'
                        : 'bg-black/10 dark:bg-white/15'
                    }`}
                    style={{ height: `${40 + (i % 4) * 15}%` }}
                  />
                )
              })}
            </div>
          </div>
        </SoundSection>

        {/* ── Calls ── */}
        <SoundSection label="Звонки и видеочаты">
          <SoundToggleRow
            label="Использовать эти устройства для звонков"
            checked={useForCalls}
            onChange={() => setUseForCalls((v) => !v)}
          />
        </SoundSection>

        {/* ── Camera ── */}
        <SoundSection label="Камера">
          <DeviceRow
            label="Устройство записи"
            value={selectedCamera}
            onChange={(v) => { setSelectedCamera(v); saveMediaSetting('videoInput', v) }}
            devices={videoInputs}
          />
          {/* Live preview */}
          <div className="mx-5 mb-4 rounded-xl overflow-hidden bg-black aspect-video relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {videoInputs.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500">
                <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Камера недоступна</p>
              </div>
            )}
          </div>
        </SoundSection>

        {/* ── Other ── */}
        <SoundSection label="Другие настройки">
          <SoundToggleRow
            label="Приём звонков на этом устройстве"
            checked={acceptCalls}
            onChange={() => setAcceptCalls((v) => !v)}
          />
          <button
            onClick={() => toast('Откройте системные настройки звука вашей ОС', { icon: 'ℹ️' })}
            className="w-full flex items-center px-5 py-3.5 text-left
              hover:bg-black/5 dark:hover:bg-white/5 transition-colors
              border-t border-black/5 dark:border-white/5"
          >
            <span className="flex-1 text-sm font-medium text-primary-500">
              Перейти к системным настройкам звука
            </span>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </SoundSection>

        <div className="h-4" />
      </div>
    </div>
  )
}

function SoundSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest px-5 mb-2">
        {label}
      </p>
      <div className="bg-white dark:bg-[#2c2c2e] mx-4 rounded-2xl overflow-hidden shadow-sm
        border border-black/5 dark:border-white/5">
        {children}
      </div>
    </div>
  )
}

function DeviceRow({
  label, value, onChange, devices,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  devices: MediaDeviceInfo[]
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5
      border-b border-black/5 dark:border-white/5 last:border-0 gap-3">
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm text-primary-500 font-medium bg-transparent
          border-none outline-none cursor-pointer text-right max-w-[140px] truncate
          dark:text-primary-400"
      >
        <option value="default">По умолчанию</option>
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || 'Устройство'}
          </option>
        ))}
      </select>
    </div>
  )
}

function SoundToggleRow({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div
      onClick={onChange}
      className="flex items-center gap-4 px-5 py-3.5 cursor-pointer
        hover:bg-black/5 dark:hover:bg-white/5 transition-colors
        border-b border-black/5 dark:border-white/5 last:border-0"
    >
      <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
      <div className={`w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
        ${checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </div>
  )
}
