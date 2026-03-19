import { useEffect } from 'react'

export function useNotificationPermission() {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
}

export function canNotify(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}
