import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Chat, ChatMember } from '@/types'
import { chatApi } from '@/api/chat'
import { useChatStore } from '@/store/chat'
import { Avatar } from '@/components/ui/Avatar'

interface Props {
  chat: Chat
  members: ChatMember[]
  onClose: () => void
  onBack: () => void
}

export function GroupSettingsPanel({ chat, members, onClose, onBack }: Props) {
  const navigate = useNavigate()
  const upsertChat = useChatStore((s) => s.upsertChat)
  const removeChat = useChatStore((s) => s.removeChat)

  const [title, setTitle] = useState(chat.title ?? '')
  const [description, setDescription] = useState(chat.description ?? '')
  const [isPublic, setIsPublic] = useState(chat.is_public)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  // Track dirty state
  useEffect(() => {
    const changed =
      title !== (chat.title ?? '') ||
      description !== (chat.description ?? '') ||
      isPublic !== chat.is_public
    setDirty(changed)
  }, [title, description, isPublic])

  const handleSave = async () => {
    if (!dirty || saving) return
    setSaving(true)
    try {
      await chatApi.updateGroup(chat.id, {
        title: title || undefined,
        description: description || undefined,
        is_public: isPublic,
      })
      upsertChat({ ...chat, title, description, is_public: isPublic })
      setDirty(false)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Удалить группу? Это действие нельзя отменить.')) return
    try {
      await chatApi.deleteGroup(chat.id)
      removeChat(chat.id)
      onClose()
      navigate('/')
    } catch { /* ignore */ }
  }

  const ownerCount = members.filter((m) => m.role === 'owner').length
  const adminCount = members.filter((m) => m.role === 'admin').length
  const memberCount = members.filter((m) => m.role === 'member' || m.role === 'restricted').length

  return (
    <>
      <div className="absolute inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-80 z-50
        bg-white dark:bg-gray-900
        shadow-2xl border-l border-black/8 dark:border-white/8
        flex flex-col animate-slideInRight">

        {/* Header */}
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
            Настройки группы
          </span>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">

          {/* Avatar + name row */}
          <div className="flex items-center gap-4 px-4 pt-5 pb-4">
            <div className="relative flex-shrink-0">
              <Avatar name={title || 'Г'} url={chat.avatar_url} size={64} />
              <button className="absolute bottom-0 right-0 w-5 h-5
                bg-primary-500 rounded-full flex items-center justify-center
                shadow ring-2 ring-white dark:ring-gray-900">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-primary-500 font-medium mb-1">Название группы</p>
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={128}
                className="w-full text-sm font-medium text-gray-900 dark:text-gray-100
                  bg-transparent border-b border-primary-400 dark:border-primary-600
                  outline-none py-0.5 pr-6"
              />
            </div>
          </div>

          {/* Description */}
          <div className="px-4 pb-4">
            <p className="text-[10px] text-gray-400 mb-1">Описание (необязательно)</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={255}
              rows={2}
              placeholder="Описание группы..."
              className="w-full text-sm text-gray-700 dark:text-gray-300
                bg-transparent border-b border-black/10 dark:border-white/10
                outline-none py-1 resize-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
            />
          </div>

          {/* Settings sections */}
          <div className="border-t border-black/5 dark:border-white/5">

            {/* Group type */}
            <SettingsRow
              icon={
                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              label="Тип группы"
              value={isPublic ? 'Публичная' : 'Приватная'}
              onClick={() => setIsPublic((v) => !v)}
              valueColor="text-primary-500"
            />

            <SettingsRow
              icon={
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              label="Разрешения"
              value=""
            />

            <SettingsRow
              icon={
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              }
              label="Пригласительные ссылки"
              value=""
            />
          </div>

          {/* Members section */}
          <div className="border-t border-black/5 dark:border-white/5 mt-2">
            <SettingsRow
              icon={
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              label="Администраторы"
              value={String(ownerCount + adminCount)}
            />

            <SettingsRow
              icon={
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              label="Участники"
              value={String(memberCount)}
            />

            <SettingsRow
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Недавние действия"
              value=""
            />
          </div>

          {/* Delete group */}
          <div className="border-t border-black/5 dark:border-white/5 mt-2 mb-4">
            <button onClick={handleDelete}
              className="w-full flex items-center gap-3 px-4 py-3.5
                hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm font-medium text-red-500">Удалить группу</span>
            </button>
          </div>
        </div>

        {/* Footer: Cancel / Save */}
        <div className="flex items-center justify-end gap-3 px-4 py-3
          border-t border-black/8 dark:border-white/8 flex-shrink-0">
          <button onClick={onBack}
            className="px-4 py-1.5 text-sm font-medium text-primary-500
              hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors">
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="px-5 py-1.5 text-sm font-medium text-white
              bg-primary-500 hover:bg-primary-600 active:bg-primary-700
              rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </>
  )
}

function SettingsRow({
  icon, label, value, onClick, valueColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onClick?: () => void
  valueColor?: string
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5
        hover:bg-black/4 dark:hover:bg-white/4 transition-colors text-left"
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{label}</span>
      {value && (
        <span className={`text-sm font-medium flex-shrink-0 ${valueColor ?? 'text-gray-400'}`}>
          {value}
        </span>
      )}
      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
