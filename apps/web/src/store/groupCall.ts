import { create } from 'zustand'

export interface GroupParticipant {
  userId: string
  userName: string
  stream: MediaStream | null
  isMuted?: boolean
  isScreenSharing?: boolean
}

// Live call info visible to non-participants (per chat)
export interface LiveGroupCall {
  callId: string
  participants: { userId: string; userName: string }[]
}

interface GroupCallState {
  // Active calls per chat (for join banner)
  liveCalls: Record<string, LiveGroupCall>

  // Our own active group call
  active: {
    callId: string
    chatId: string
    localStream: MediaStream | null
    screenStream: MediaStream | null
    isMuted: boolean
    isVideoOff: boolean
    isMinimized: boolean
    isScreenSharing: boolean
    participants: GroupParticipant[]
  } | null

  // Live call tracking
  setLiveCall: (chatId: string, call: LiveGroupCall) => void
  removeLiveCall: (chatId: string) => void
  liveCallMemberJoined: (chatId: string, callId: string, userId: string, userName: string) => void
  liveCallMemberLeft: (chatId: string, userId: string) => void

  // Our call actions
  joinCall: (callId: string, chatId: string, localStream: MediaStream) => void
  addRemoteParticipant: (userId: string, userName: string) => void
  removeRemoteParticipant: (userId: string) => void
  setParticipantStream: (userId: string, stream: MediaStream) => void
  setMuted: (b: boolean) => void
  setVideoOff: (b: boolean) => void
  setMinimized: (b: boolean) => void
  setScreenSharing: (b: boolean) => void
  setGroupScreenStream: (stream: MediaStream | null) => void
  setRemoteScreenSharing: (userId: string, isSharing: boolean) => void
  leaveCall: () => void
}

export const useGroupCallStore = create<GroupCallState>((set, get) => ({
  liveCalls: {},
  active: null,

  setLiveCall: (chatId, call) =>
    set((s) => ({ liveCalls: { ...s.liveCalls, [chatId]: call } })),

  removeLiveCall: (chatId) =>
    set((s) => {
      const next = { ...s.liveCalls }
      delete next[chatId]
      return { liveCalls: next }
    }),

  liveCallMemberJoined: (chatId, callId, userId, userName) =>
    set((s) => {
      const existing = s.liveCalls[chatId]
      const participants = existing
        ? [...existing.participants.filter((p) => p.userId !== userId), { userId, userName }]
        : [{ userId, userName }]
      return { liveCalls: { ...s.liveCalls, [chatId]: { callId, participants } } }
    }),

  liveCallMemberLeft: (chatId, userId) =>
    set((s) => {
      const existing = s.liveCalls[chatId]
      if (!existing) return s
      const participants = existing.participants.filter((p) => p.userId !== userId)
      if (participants.length === 0) {
        const next = { ...s.liveCalls }
        delete next[chatId]
        return { liveCalls: next }
      }
      return { liveCalls: { ...s.liveCalls, [chatId]: { ...existing, participants } } }
    }),

  joinCall: (callId, chatId, localStream) =>
    set({
      active: {
        callId, chatId, localStream, screenStream: null,
        isMuted: false, isVideoOff: false, isMinimized: false, isScreenSharing: false,
        participants: [],
      },
    }),

  addRemoteParticipant: (userId, userName) =>
    set((s) => {
      if (!s.active) return s
      const already = s.active.participants.find((p) => p.userId === userId)
      if (already) return s
      return {
        active: {
          ...s.active,
          participants: [...s.active.participants, { userId, userName, stream: null }],
        },
      }
    }),

  removeRemoteParticipant: (userId) =>
    set((s) => {
      if (!s.active) return s
      return {
        active: {
          ...s.active,
          participants: s.active.participants.filter((p) => p.userId !== userId),
        },
      }
    }),

  setParticipantStream: (userId, stream) =>
    set((s) => {
      if (!s.active) return s
      return {
        active: {
          ...s.active,
          participants: s.active.participants.map((p) =>
            p.userId === userId ? { ...p, stream } : p
          ),
        },
      }
    }),

  setMuted: (isMuted) =>
    set((s) => s.active ? { active: { ...s.active, isMuted } } : s),

  setVideoOff: (isVideoOff) =>
    set((s) => s.active ? { active: { ...s.active, isVideoOff } } : s),

  setMinimized: (isMinimized) =>
    set((s) => s.active ? { active: { ...s.active, isMinimized } } : s),

  setScreenSharing: (isScreenSharing) =>
    set((s) => s.active ? { active: { ...s.active, isScreenSharing } } : s),

  setGroupScreenStream: (screenStream) =>
    set((s) => s.active ? { active: { ...s.active, screenStream } } : s),

  setRemoteScreenSharing: (userId, isSharing) =>
    set((s) => {
      if (!s.active) return s
      return {
        active: {
          ...s.active,
          participants: s.active.participants.map((p) =>
            p.userId === userId ? { ...p, isScreenSharing: isSharing } : p
          ),
        },
      }
    }),

  leaveCall: () =>
    set((s) => {
      s.active?.localStream?.getTracks().forEach((t) => t.stop())
      return { active: null }
    }),
}))
