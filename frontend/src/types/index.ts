// Роли пользователей
export type UserRole = 'participant' | 'mentor' | 'admin'

// Пользователь (расширяет стандартный PocketBase auth model)
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  created: string
  updated: string
}

// Статус марафона
export type MarathonStatus = 'draft' | 'public' | 'active' | 'completed'

// Марафон
export interface Marathon {
  id: string
  title: string
  description: string
  durationDays: number
  startDate: string
  endDate: string
  mentorId: string
  participants: string[] // массив ID пользователей
  status: MarathonStatus
  created: string
  updated: string
}

// Ежедневное задание
export interface DailyTask {
  id: string
  marathonId: string
  dayNumber: number
  title: string
  description: string
  type: 'meal' | 'exercise' | 'both'
  materials?: string[] // ссылки на фото/видео
  created: string
}

// Отчёт участника
export interface Report {
  id: string
  taskId: string
  userId: string
  marathonId: string
  dayNumber: number
  mealPhotos?: string[]
  exerciseDone?: boolean
  exercisePhotos?: string[]
  comment?: string
  submittedAt: string
  reviewedBy?: string // ID ментора
  reviewComment?: string
  status: 'pending' | 'approved' | 'rejected'
  created: string
  updated: string
}

// Сообщение в чате марафона
export interface ChatMessage {
  id: string
  marathonId: string
  userId: string
  text: string
  attachments?: string[]
  created: string
}

// Статистика (для дашбордов)
export interface MarathonStats {
  marathonId: string
  totalParticipants: number
  activeParticipants: number
  completionRate: number // процент завершивших
  averageReportsPerDay: number
}