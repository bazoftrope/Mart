import PocketBase from 'pocketbase'
import type { User, Marathon, DailyTask, Report, ChatMessage } from '@/types'

// URL из env или дефолтный (HTTPS для продакшена)
const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'https://185.72.145.228'

export const pb = new PocketBase(POCKETBASE_URL)

// Коллекции PB
export const collections = {
  users: pb.collection('users'),
  marathons: pb.collection('marathons'),
  tasks: pb.collection('tasks'),
  reports: pb.collection('reports'),
  messages: pb.collection('messages'),
} as const

// Хелпер: текущий пользователь
export const getCurrentUser = (): User | null => {
  return pb.authStore.model as User | null
}

// Хелпер: авторизован ли
export const isAuthenticated = (): boolean => {
  return pb.authStore.isValid
}

// Подписка на изменения авторизации (для reactive обновлений)
export const onAuthChange = (callback: (user: User | null) => void) => {
  pb.authStore.onChange(() => {
    callback(getCurrentUser())
  })
}