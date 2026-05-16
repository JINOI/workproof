import { notFound } from 'next/navigation'
import { randomUUID } from 'node:crypto'

import { createClient } from '@/lib/supabase/server'
import type { QuizQuestionInsert, SopInsert, SubmitEducationPayload } from './types'

type NewQuizQuestionInput = Omit<QuizQuestionInsert, 'sop_id'>

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims?.sub) {
    return null
  }

  return { id: data.claims.sub }
}

export async function listSops() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  const { data, error } = await supabase
    .from('sops')
    .select('*, education_logs(status)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data.map((sop) => {
    const totalWorkers = sop.education_logs.length
    const completedWorkers = sop.education_logs.filter((log) => log.status === 'safe' || log.status === 'warning').length

    return {
      ...sop,
      totalWorkers,
      completedWorkers,
      completionRate: totalWorkers === 0 ? 0 : Math.round((completedWorkers / totalWorkers) * 100),
    }
  })
}

export async function getSopForManager(id: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  const { data, error } = await supabase
    .from('sops')
    .select('*, quiz_questions(*), education_logs(*)')
    .eq('id', id)
    .eq('owner_id', user.id)
    .order('position', { referencedTable: 'quiz_questions', ascending: true })
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      notFound()
    }

    throw error
  }

  return data
}

export async function getPublicEducationByToken(publicToken: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sops')
    .select('id, title, description, education_cards, languages, quiz_questions(*)')
    .eq('public_token', publicToken)
    .eq('status', 'active')
    .order('position', { referencedTable: 'quiz_questions', ascending: true })
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      notFound()
    }

    throw error
  }

  return data
}

export async function createSop(input: Omit<SopInsert, 'owner_id'> & { questions?: NewQuizQuestionInput[] }) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  const { questions = [], ...sopInput } = input
  const { data: sop, error: sopError } = await supabase
    .from('sops')
    .insert({ ...sopInput, owner_id: user.id })
    .select()
    .single()

  if (sopError) {
    throw sopError
  }

  if (questions.length > 0) {
    const { error: questionsError } = await supabase.from('quiz_questions').insert(
      questions.map((question) => ({
        ...question,
        sop_id: sop.id,
      })),
    )

    if (questionsError) {
      throw questionsError
    }
  }

  return sop
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'sop-document'
}

export async function uploadSopSourceFile(input: { fileName: string; mimeType: string; buffer: Buffer }) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  const storagePath = `${user.id}/${randomUUID()}-${sanitizeFileName(input.fileName)}`
  const { error } = await supabase.storage.from('sop-files').upload(storagePath, input.buffer, {
    contentType: input.mimeType,
    upsert: false,
  })

  if (error) {
    throw error
  }

  return storagePath
}

export async function submitEducationResult(input: SubmitEducationPayload) {
  const supabase = await createClient()
  const wrongQuestionIds = input.answers.filter((answer) => !answer.isCorrect).map((answer) => answer.questionId)
  const passed = input.passed ?? wrongQuestionIds.length === 0
  const status = !passed ? 'failed' : input.attempts <= 3 && wrongQuestionIds.length === 0 ? 'safe' : 'warning'

  const { data, error } = await supabase
    .from('education_logs')
    .insert({
      sop_id: input.sopId,
      worker_name: input.workerName,
      worker_birth_date: input.workerBirthDate,
      language: input.language ?? 'ko',
      status,
      attempts: input.attempts,
      completed_at: new Date().toISOString(),
      elapsed_seconds: input.elapsedSeconds,
      wrong_question_ids: wrongQuestionIds,
      answers: input.answers,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
