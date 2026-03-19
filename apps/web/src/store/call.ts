import { create } from 'zustand'

export type CallType = 'voice' | 'video'
export type CallStatus = 'connecting' | 'ringing' | 'reconnecting' | 'active' | 'ended'

export interface IncomingCall {
  callId: string
  callerId: string
  callerName: string
  callerAvatar?: string
  type: CallType
}

export interface ActiveCall {
  callId: string
  targetId: string
  targetName: string
  type: CallType
  status: CallStatus
  isInitiator: boolean
  isMuted: boolean
  isVideoOff: boolean
  isSpeakerOn: boolean
  isScreenSharing: boolean
  startedAt?: number
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  screenStream: MediaStream | null
}

interface CallState {
  incoming: IncomingCall | null
  active: ActiveCall | null

  setIncoming: (call: IncomingCall | null) => void
  setActive: (call: ActiveCall | null) => void
  updateActive: (patch: Partial<ActiveCall>) => void
  clearAll: () => void
}

export const useCallStore = create<CallState>((set) => ({
  incoming: null,
  active: null,

  setIncoming: (call) => set({ incoming: call }),
  setActive: (call) => set({ active: call }),
  updateActive: (patch) =>
    set((s) => s.active ? { active: { ...s.active, ...patch } } : s),
  clearAll: () =>
    set((s) => {
      s.active?.localStream?.getTracks().forEach((t) => t.stop())
      s.active?.remoteStream?.getTracks().forEach((t) => t.stop())
      s.active?.screenStream?.getTracks().forEach((t) => t.stop())
      return { incoming: null, active: null }
    }),
}))
