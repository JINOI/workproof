import type { Database, Json } from '@/lib/supabase/database.types'

export type Sop = Database['public']['Tables']['sops']['Row']
export type SopInsert = Database['public']['Tables']['sops']['Insert']
export type SopUpdate = Database['public']['Tables']['sops']['Update']
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row']
export type QuizQuestionInsert = Database['public']['Tables']['quiz_questions']['Insert']
export type EducationLog = Database['public']['Tables']['education_logs']['Row']
export type EducationLogInsert = Database['public']['Tables']['education_logs']['Insert']

export type EducationCardPayload = {
  language?: string
  position?: number
  title: string
  content: string
  icon: 'warning' | 'safety' | 'prohibited' | 'equipment'
}

export type QuizAnswerPayload = {
  questionId: string
  selectedAnswer: Json
  isCorrect: boolean
  attempt?: number
}

export type SubmitEducationPayload = {
  sopId: string
  workerName: string
  workerBirthDate: string
  language?: string
  attempts: number
  elapsedSeconds: number
  passed?: boolean
  answers: QuizAnswerPayload[]
}
