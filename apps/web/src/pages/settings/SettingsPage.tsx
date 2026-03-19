import { useState, useRef, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { api } from '@/api/client'
import { Avatar } from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const navigate = useNavigate()
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
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
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
      toast.success('Avatar updated')
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate('/')}
          className="icon-btn"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center py-8 bg-gray-50 dark:bg-gray-800">
          <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Avatar
              name={`${user?.first_name} ${user?.last_name ?? ''}`}
              url={user?.avatar_url}
              size={96}
            />
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center
              justify-center opacity-0 hover:opacity-100 transition">
              {uploadingAvatar
                ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <span className="text-white text-xl">📷</span>
              }
            </div>
          </div>
          <input ref={fileRef} type="file" className="hidden"
            accept="image/*" onChange={handleAvatarUpload} />
          <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-sm text-gray-500">@{user?.username}</p>
        </div>

        {/* Fields */}
        <div className="px-4 py-6 space-y-4 max-w-md mx-auto w-full">
          {[
            { label: 'First Name', key: 'first_name', required: true },
            { label: 'Last Name', key: 'last_name' },
            { label: 'Username', key: 'username', required: true, prefix: '@' },
            { label: 'Bio', key: 'bio', multiline: true },
          ].map(({ label, key, required, prefix, multiline }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label} {required && <span className="text-red-400">*</span>}
              </label>
              {multiline ? (
                <textarea
                  value={form[key as keyof typeof form]}
                  onChange={(e) => update(key, e.target.value)}
                  rows={3}
                  placeholder={`Your ${label.toLowerCase()}...`}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl
                    bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              ) : (
                <div className="relative">
                  {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>
                  )}
                  <input
                    type="text"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => update(key, e.target.value)}
                    className={`w-full py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl
                      bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-primary-500
                      ${prefix ? 'pl-7 pr-4' : 'px-4'}`}
                  />
                </div>
              )}
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white
              font-semibold rounded-xl transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
