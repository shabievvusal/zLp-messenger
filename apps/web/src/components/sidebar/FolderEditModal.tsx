import { useState } from 'react'
import { useChatStore } from '@/store/chat'
import { useFolderStore, ChatFolder } from '@/store/folders'
import { Avatar } from '@/components/ui/Avatar'

const EMOJIS = ['📁', '💼', '🎓', '🏠', '❤️', '⭐', '🔥', '💡', '🎮', '🎵',
  '💻', '📱', '✈️', '🌍', '📰', '🔔', '👥', '🏆', '🛒', '📚']

interface Props {
  folder?: ChatFolder // if provided, edit mode
  onClose: () => void
}

export function FolderEditModal({ folder, onClose }: Props) {
  const chats = useChatStore((s) => s.chats)
  const { addFolder, updateFolder, deleteFolder } = useFolderStore()

  const [name, setName] = useState(folder?.name ?? '')
  const [emoji, setEmoji] = useState(folder?.emoji ?? '📁')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(folder?.chatIds ?? [])
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [search, setSearch] = useState('')

  const filteredChats = chats.filter((c) =>
    (c.title ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleSave = () => {
    if (!name.trim()) return
    if (folder) {
      updateFolder(folder.id, { name: name.trim(), emoji, chatIds: [...selectedIds] })
    } else {
      addFolder({
        id: crypto.randomUUID(),
        name: name.trim(),
        emoji,
        chatIds: [...selectedIds],
      })
    }
    onClose()
  }

  const handleDelete = () => {
    if (!folder) return
    deleteFolder(folder.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md bg-white dark:bg-[#1c1c1e]
          rounded-2xl shadow-2xl overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4
          border-b border-black/5 dark:border-white/5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {folder ? 'Изменить папку' : 'Новая папка'}
          </h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full
              hover:bg-black/8 dark:hover:bg-white/10 transition-colors text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Emoji picker */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-medium">Иконка</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center
                    transition-all ${emoji === e
                      ? 'bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-500 scale-110'
                      : 'hover:bg-black/5 dark:hover:bg-white/8'
                    }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-medium">Название</p>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название папки..."
              maxLength={20}
              className="w-full bg-black/5 dark:bg-white/8 rounded-xl px-4 py-2.5
                text-sm text-gray-900 dark:text-gray-100
                placeholder:text-gray-400 outline-none
                focus:ring-2 focus:ring-primary-500/50"
            />
          </div>

          {/* Chat selection */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-medium">
              Чаты ({selectedIds.size} выбрано)
            </p>
            <div className="relative mb-2">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск чата..."
                className="w-full bg-black/5 dark:bg-white/8 rounded-xl pl-8 pr-3 py-2
                  text-sm text-gray-900 dark:text-gray-100
                  placeholder:text-gray-400 outline-none"
              />
            </div>
            <div className="space-y-0.5 max-h-48 overflow-y-auto scrollbar-thin">
              {filteredChats.map((chat) => {
                const checked = selectedIds.has(chat.id)
                return (
                  <button
                    key={chat.id}
                    onClick={() => toggle(chat.id)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-xl
                      hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
                      transition-colors ${checked
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300 dark:border-gray-600'}`}>
                      {checked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <Avatar name={chat.title ?? '?'} url={chat.avatar_url} size={30} />
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate flex-1">
                      {chat.title ?? 'Чат'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5 pt-2">
          {folder && (
            <button
              onClick={confirmDelete ? handleDelete : () => setConfirmDelete(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium
                bg-red-50 dark:bg-red-900/20 text-red-500
                hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              {confirmDelete ? 'Точно удалить?' : 'Удалить'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold
              bg-primary-500 text-white
              hover:bg-primary-600 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {folder ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}
