import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatFolder {
  id: string
  name: string
  emoji: string
  chatIds: string[]
}

interface FolderState {
  folders: ChatFolder[]
  activeFolderId: string | null // null = "Все чаты"

  setActiveFolder: (id: string | null) => void
  addFolder: (folder: ChatFolder) => void
  updateFolder: (id: string, updates: Partial<Omit<ChatFolder, 'id'>>) => void
  deleteFolder: (id: string) => void
}

export const useFolderStore = create<FolderState>()(
  persist(
    (set) => ({
      folders: [],
      activeFolderId: null,

      setActiveFolder: (id) => set({ activeFolderId: id }),

      addFolder: (folder) =>
        set((s) => ({ folders: [...s.folders, folder] })),

      updateFolder: (id, updates) =>
        set((s) => ({
          folders: s.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),

      deleteFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          activeFolderId: s.activeFolderId === id ? null : s.activeFolderId,
        })),
    }),
    { name: 'zlp-folders' }
  )
)
