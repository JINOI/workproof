import { notFound } from 'next/navigation'
import { randomUUID } from 'node:crypto'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'
import type { QuizQuestionInsert, SopInsert, SubmitEducationPayload } from './types'
import { summarizeLatestWorkerCompletion, type WorkerLogRow } from './workers'

type NewQuizQuestionInput = Omit<QuizQuestionInsert, 'sop_id' | 'organization_name'>
type FrequentSopTemplateQuestion = {
  language: string
  position: number
  type: 'ox' | 'multiple'
  prompt: string
  options: Json | null
  correct_answer: Json
  explanation: string | null
}

type CompanyProfile = {
  id: string
  organization_name: string | null
  company_public_token: string
}

type SopListEducationLog = {
  id: string
  worker_name: string
  worker_birth_date: string
  status: WorkerLogRow['status']
  attempts: number
  completed_at: string | null
  wrong_question_ids: string[]
}

function toSopWorkerLogRow(log: SopListEducationLog, sop: { id: string; title: string }): WorkerLogRow {
  return {
    id: log.id,
    name: log.worker_name,
    birthDate: log.worker_birth_date,
    status: log.status,
    attempts: log.attempts,
    completedAt: log.completed_at,
    completedAtSortValue: log.completed_at,
    wrongAnswers: log.wrong_question_ids,
    sopId: sop.id,
    sopTitle: sop.title,
  }
}

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
    .select('*, education_logs(id, worker_name, worker_birth_date, status, attempts, completed_at, wrong_question_ids)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data.map((sop) => {
    const { education_logs, ...sopFields } = sop
    const { totalWorkers, completedWorkers, completionRate } = summarizeLatestWorkerCompletion(
      education_logs.map((log) => toSopWorkerLogRow(log, sop)),
    )

    return {
      ...sopFields,
      totalWorkers,
      completedWorkers,
      completionRate,
    }
  })
}

async function getCompanyProfileForUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<CompanyProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, organization_name, company_public_token')
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getCompanyQrForManager() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  const profile = await getCompanyProfileForUser(supabase, user.id)

  return {
    organizationName: profile.organization_name,
    companyPublicToken: profile.company_public_token,
    educationPath: `/education/company/${profile.company_public_token}`,
  }
}

export async function listFrequentSopTemplates() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  const { data: templates, error: templatesError } = await supabase
    .from('frequent_sop_templates')
    .select('id, template_key, title, description, languages, display_order')
    .order('display_order', { ascending: true })

  if (templatesError) {
    throw templatesError
  }

  const templateKeys = templates.map((template) => template.template_key)
  const { data: addedSops, error: addedSopsError } =
    templateKeys.length > 0
      ? await supabase
          .from('sops')
          .select('id, source_template_key')
          .eq('owner_id', user.id)
          .in('source_template_key', templateKeys)
      : { data: [], error: null }

  if (addedSopsError) {
    throw addedSopsError
  }

  const addedByTemplateKey = new Map(
    (addedSops ?? [])
      .filter((sop): sop is { id: string; source_template_key: string } => Boolean(sop.source_template_key))
      .map((sop) => [sop.source_template_key, sop.id]),
  )

  return templates.map((template) => ({
    ...template,
    addedSopId: addedByTemplateKey.get(template.template_key) ?? null,
  }))
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

export async function deleteSop(id: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  const { data: sop, error: lookupError } = await supabase
    .from('sops')
    .select('id, source_file_path')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (lookupError) {
    if (lookupError.code === 'PGRST116') {
      return null
    }

    throw lookupError
  }

  const { error: deleteError } = await supabase.from('sops').delete().eq('id', id).eq('owner_id', user.id)

  if (deleteError) {
    throw deleteError
  }

  if (sop.source_file_path) {
    const { error: storageError } = await supabase.storage.from('sop-files').remove([sop.source_file_path])

    if (storageError) {
      console.warn('Failed to remove safety management guide source file after deleting guide', {
        sopId: id,
        sourceFilePath: sop.source_file_path,
        message: storageError.message,
      })
    }
  }

  return sop
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

export async function listCompanyEducationSops(companyPublicToken: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sops')
    .select('id, title, description, languages, public_token, created_at')
    .eq('company_public_token', companyPublicToken)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function createSop(input: Omit<SopInsert, 'owner_id' | 'company_public_token'> & { questions?: NewQuizQuestionInput[] }) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  const { questions = [], ...sopInput } = input
  const profile = await getCompanyProfileForUser(supabase, user.id)
  const { data: sop, error: sopError } = await supabase
    .from('sops')
    .insert({ ...sopInput, owner_id: user.id, company_public_token: profile.company_public_token })
    .select()
    .single()

  if (sopError) {
    throw sopError
  }

  if (questions.length > 0) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      throw profileError
    }

    const { error: questionsError } = await supabase.from('quiz_questions').insert(
      questions.map((question) => ({
        ...question,
        sop_id: sop.id,
        organization_name: profile?.organization_name ?? null,
      })),
    )

    if (questionsError) {
      throw questionsError
    }
  }

  return sop
}

export async function addFrequentSopTemplateToCurrentUser(templateKey: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  const { data: existingSop, error: existingSopError } = await supabase
    .from('sops')
    .select('id, title, description, created_at, status')
    .eq('owner_id', user.id)
    .eq('source_template_key', templateKey)
    .maybeSingle()

  if (existingSopError) {
    throw existingSopError
  }

  if (existingSop) {
    return existingSop
  }

  const { data: template, error: templateError } = await supabase
    .from('frequent_sop_templates')
    .select('*, frequent_sop_template_questions(*)')
    .eq('template_key', templateKey)
    .single()

  if (templateError) {
    throw templateError
  }

  const questions = [...(template.frequent_sop_template_questions as FrequentSopTemplateQuestion[])]
    .sort((left, right) => {
      if (left.language === right.language) {
        return left.position - right.position
      }

      return left.language.localeCompare(right.language)
    })
    .map((question) => ({
      language: question.language,
      position: question.position,
      type: question.type,
      prompt: question.prompt,
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
    }))

  return createSop({
    title: template.title,
    description: template.description,
    source_template_key: template.template_key,
    ai_summary: template.ai_summary,
    education_cards: template.education_cards,
    languages: template.languages,
    status: 'active',
    questions,
  })
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

  const { error } = await supabase.from('education_logs').insert({
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

  if (error) {
    throw error
  }

  return {
    status,
    attempts: input.attempts,
    wrongQuestionIds,
  }
}
