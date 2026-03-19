import { useEffect, useState, RefObject } from 'react'
import type { ChatMember } from '@/types'
import { Avatar } from '@/components/ui/Avatar'

interface Props {
  query: string
  members: ChatMember[]
  onSelect: (username: string) => void
  anchorRef: RefObject<HTMLTextAreaElement>
}

export function MentionAutocomplete({ query, members, onSelect, anchorRef }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0)

  const filtered = members
    .filter((m) => m.user && m.user.username.toLowerCase().startsWith(query.toLowerCase()))
    .slice(0, 6)

  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (filtered.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((i) => (i + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((i) => (i - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        const member = filtered[selectedIdx]
        if (member?.user) {
          e.preventDefault()
          onSelect(member.user.username)
        }
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [filtered, selectedIdx, onSelect])

  if (filtered.length === 0) return null

  return (
    <div className="absolute bottom-full left-0 mb-1 w-64 z-50
      bg-white dark:bg-gray-800 rounded-2xl shadow-2xl
      border border-black/8 dark:border-white/8 overflow-hidden animate-fadeIn">
      {filtered.map((member, idx) => {
        const user = member.user!
        const name = `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
        return (
          <button
            key={member.user_id}
            onClick={() => onSelect(user.username)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors
              ${idx === selectedIdx
                ? 'bg-primary-50 dark:bg-primary-900/30'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
          >
            <Avatar name={name} url={user.avatar_url} size={32} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</p>
              <p className="text-xs text-primary-500 truncate">@{user.username}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
