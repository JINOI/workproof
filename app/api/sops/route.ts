import { NextResponse } from 'next/server'
import { z } from 'zod'

import { generateSopWithGemini, normalizeLanguages, toJson } from '@/lib/workproof/ai'
import { createSop, listSops, uploadSopSourceFile } from '@/lib/workproof/repository'

export const runtime = 'nodejs'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const MAX_MULTIPART_BODY_BYTES = 25 * 1024 * 1024

const createSopJsonSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  source_file_path: z.string().nullable().optional(),
  source_file_name: z.string().nullable().optional(),
  source_file_mime: z.string().nullable().optional(),
  ai_summary: z.unknown().optional(),
  education_cards: z.unknown().optional(),
  languages: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  questions: z
    .array(
      z.object({
        language: z.string().optional(),
        position: z.number().int().positive(),
        type: z.enum(['ox', 'multiple']),
        prompt: z.string().min(1),
        options: z.unknown().nullable().optional(),
        correct_answer: z.unknown(),
        explanation: z.string().nullable().optional(),
      }),
    )
    .optional(),
})

function parseLanguages(formData: FormData) {
  const rawLanguages = formData.getAll('languages').flatMap((value) => {
    if (typeof value !== 'string') return []
    try {
      const parsed = JSON.parse(value) as unknown
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [value]
    } catch {
      return [value]
    }
  })

  return normalizeLanguages(rawLanguages)
}

function resolveMimeType(file: File) {
  if (file.type) return file.type

  const extension = file.name.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf':
      return 'application/pdf'
    case 'txt':
    case 'md':
      return 'text/plain'
    case 'doc':
      return 'application/msword'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    default:
      return 'application/octet-stream'
  }
}

async function parseMultipartFormData(request: Request) {
  try {
    return await request.formData()
  } catch {
    throw new Error('업로드 요청을 해석하지 못했습니다. 파일은 20MB 이하인지 확인하고 다시 업로드하세요.')
  }
}

export async function GET() {
  const sops = await listSops()
  return NextResponse.json({ sops })
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const contentLength = Number(request.headers.get('content-length') ?? 0)

      if (contentLength > MAX_MULTIPART_BODY_BYTES) {
        return NextResponse.json({ error: '파일은 20MB 이하만 업로드할 수 있습니다.' }, { status: 413 })
      }

      const formData = await parseMultipartFormData(request)
      const file = formData.get('file')

      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'SOP 문서 파일을 업로드하세요.' }, { status: 400 })
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: '파일은 20MB 이하만 업로드할 수 있습니다.' }, { status: 400 })
      }

      const languages = parseLanguages(formData)
      const mimeType = resolveMimeType(file)
      const buffer = Buffer.from(await file.arrayBuffer())
      const generated = await generateSopWithGemini({
        fileName: file.name,
        mimeType,
        base64Data: buffer.toString('base64'),
        languages,
      })
      const sourceFilePath = await uploadSopSourceFile({
        fileName: file.name,
        mimeType,
        buffer,
      })

      const sop = await createSop({
        title: generated.title,
        description: generated.description,
        source_file_path: sourceFilePath,
        source_file_name: file.name,
        source_file_mime: mimeType,
        ai_summary: toJson(generated.summary),
        education_cards: toJson(generated.educationCards),
        languages,
        status: 'active',
        questions: generated.quizQuestions.map((question) => ({
          language: question.language,
          position: question.position,
          type: question.type,
          prompt: question.prompt,
          options: question.type === 'multiple' ? toJson(question.options ?? []) : null,
          correct_answer: toJson(question.correctAnswer),
          explanation: question.explanation ?? null,
        })),
      })

      return NextResponse.json({ sop }, { status: 201 })
    }

    const body = createSopJsonSchema.parse(await request.json())
    const sop = await createSop({
      ...body,
      ai_summary: body.ai_summary ? toJson(body.ai_summary) : undefined,
      education_cards: body.education_cards ? toJson(body.education_cards) : undefined,
      questions: body.questions?.map((question) => ({
        ...question,
        options: question.options === undefined ? undefined : toJson(question.options),
        correct_answer: toJson(question.correct_answer),
      })),
    })

    return NextResponse.json({ sop }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SOP를 생성하지 못했습니다.'
    const status = message.includes('Authentication') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
