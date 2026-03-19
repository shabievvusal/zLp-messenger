import { api } from './client'
import type { Chat, ChatMember, Message, Attachment } from '@/types'

export const chatApi = {
  getChats: () => api.get<Chat[]>('/chats'),

  createPrivate: (targetId: string) =>
    api.post<Chat>('/chats/private', { target_id: targetId }),

  createGroup: (data: { title: string; description?: string; member_ids?: string[]; is_channel?: boolean }) =>
    api.post<Chat>('/chats/group', data),

  getMessages: (chatId: string, limit = 50, offset = 0) =>
    api.get<Message[]>(`/chats/${chatId}/messages`, { params: { limit, offset } }),

  sendMessage: (chatId: string, data: { text?: string; type?: string; reply_to_id?: string }) =>
    api.post<Message>(`/chats/${chatId}/messages`, data),

  editMessage: (msgId: string, text: string) =>
    api.patch(`/messages/${msgId}`, { text }),

  deleteMessage: (msgId: string) =>
    api.delete(`/messages/${msgId}`),

  addReaction: (msgId: string, emoji: string) =>
    api.post(`/messages/${msgId}/react`, { emoji }),

  removeReaction: (msgId: string) =>
    api.delete(`/messages/${msgId}/react`),

  searchMessages: (chatId: string, q: string) =>
    api.get<Message[]>(`/chats/${chatId}/messages/search`, { params: { q } }),

  getMembers: (chatId: string) =>
    api.get<ChatMember[]>(`/chats/${chatId}/members`),

  forwardMessage: (targetChatId: string, msg: Message) =>
    api.post<Message>(`/chats/${targetChatId}/messages`, {
      type: msg.type ?? 'text',
      text: msg.text,
      forward_from_id: msg.id,
    }),

  muteChat: (chatId: string, until: string | null) =>
    api.patch(`/chats/${chatId}/mute`, { until }),

  getSharedMedia: (chatId: string, type: 'photo' | 'document' = 'photo', limit = 20, offset = 0) =>
    api.get<Attachment[]>(`/chats/${chatId}/media`, { params: { type, limit, offset } }),
}
