import { z } from 'zod'

import type { Json } from '@/lib/supabase/database.types'
import { SUPPORTED_LANGUAGE_CODES, SUPPORTED_LANGUAGES, type SupportedLanguageCode } from './languages.ts'

const educationCardSchema = z.object({
  language: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
  icon: z.enum(['warning', 'safety', 'prohibited', 'equipment']),
})

const quizQuestionSchema = z.object({
  language: z.string(),
  position: z.number().int().positive(),
  type: z.enum(['ox', 'multiple']),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).nullable().optional(),
  correctAnswer: z.union([z.boolean(), z.string(), z.number()]),
  explanation: z.string().min(1).nullable().optional(),
})

const generatedSopSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  summary: z.object({
    workSteps: z.array(z.string()).min(1),
    hazards: z.array(z.string()).min(1),
    protectiveEquipment: z.array(z.string()).min(1),
    prohibitedActions: z.array(z.string()).min(1),
  }),
  educationCards: z.array(educationCardSchema).min(1),
  quizQuestions: z.array(quizQuestionSchema).min(1),
})

export type GeneratedSop = z.infer<typeof generatedSopSchema>

type GenerateSopInput = {
  fileName: string
  mimeType: string
  base64Data: string
  languages: string[]
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  error?: {
    message?: string
  }
}

export function normalizeLanguages(input: string[]): SupportedLanguageCode[] {
  const normalized = input.filter((value): value is SupportedLanguageCode =>
    SUPPORTED_LANGUAGE_CODES.includes(value as SupportedLanguageCode),
  )

  return normalized.length > 0 ? Array.from(new Set(normalized)) : ['ko']
}

function buildPrompt(languages: SupportedLanguageCode[]) {
  const targetLanguages = SUPPORTED_LANGUAGES.filter((language) => languages.includes(language.code))
    .map((language) => `${language.code}: ${language.promptName}`)
    .join(', ')

  return [
    'You are WorkProof, a safety education generator for manufacturing and construction sites.',
    'Read the attached SOP document and generate training content for foreign workers.',
    '',
    `Target languages: ${targetLanguages}.`,
    '',
    'Return only valid JSON. Do not wrap it in Markdown.',
    'Schema:',
    '{',
    '  "title": "short SOP title in Korean",',
    '  "description": "one sentence Korean description",',
    '  "summary": {',
    '    "workSteps": ["..."],',
    '    "hazards": ["..."],',
    '    "protectiveEquipment": ["..."],',
    '    "prohibitedActions": ["..."]',
    '  },',
    '  "educationCards": [',
    '    { "language": "ko", "title": "...", "content": "...", "icon": "warning|safety|prohibited|equipment" }',
    '  ],',
    '  "quizQuestions": [',
    '    {',
    '      "language": "ko",',
    '      "position": 1,',
    '      "type": "ox",',
    '      "prompt": "...",',
    '      "options": null,',
    '      "correctAnswer": true,',
    '      "explanation": "..."',
    '    },',
    '    {',
    '      "language": "ko",',
    '      "position": 2,',
    '      "type": "multiple",',
    '      "prompt": "...",',
    '      "options": ["...", "...", "...", "..."],',
    '      "correctAnswer": "exact option text",',
    '      "explanation": "..."',
    '    }',
    '  ]',
    '}',
    '',
    'Rules:',
    '- Create exactly 4 education cards per language: work steps, hazards, protective equipment, prohibited actions.',
    '- Create exactly 10 quiz questions per language.',
    '- Mix O/X and multiple-choice questions.',
    '- Multiple-choice correctAnswer must be the exact option text, not an index.',
    '- Keep worker-facing text short, concrete, and easy to understand.',
    '- Do not invent hazards that conflict with the document. If the document is sparse, create conservative general safety questions from the available content.',
  ].join('\n')
}

function stripJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function getResponseText(payload: GeminiResponse) {
  const text = payload.candidates?.flatMap((candidate) => candidate.content?.parts ?? []).find((part) => part.text)?.text

  if (!text) {
    throw new Error(payload.error?.message ?? 'Gemini 응답에서 생성 결과를 찾지 못했습니다.')
  }

  return text
}

function normalizeGeneratedSop(value: GeneratedSop, languages: SupportedLanguageCode[]): GeneratedSop {
  const allowedLanguages = new Set(languages)

  const educationCards = value.educationCards.filter((card) => allowedLanguages.has(card.language as SupportedLanguageCode))
  const quizQuestions = value.quizQuestions
    .filter((question) => allowedLanguages.has(question.language as SupportedLanguageCode))
    .map((question) => {
      if (question.type === 'ox') {
        return {
          ...question,
          options: null,
          correctAnswer: Boolean(question.correctAnswer),
        }
      }

      const options = question.options?.filter(Boolean) ?? []
      const correctAnswer =
        typeof question.correctAnswer === 'number' ? options[question.correctAnswer] : String(question.correctAnswer)

      return {
        ...question,
        type: 'multiple' as const,
        options,
        correctAnswer,
      }
    })

  return {
    ...value,
    educationCards,
    quizQuestions,
  }
}

export function parseGeneratedSop(rawText: string, languages: SupportedLanguageCode[]) {
  const parsed = generatedSopSchema.parse(JSON.parse(stripJsonFence(rawText)))
  return normalizeGeneratedSop(parsed, languages)
}

export function toJson(value: unknown): Json {
  return value as Json
}

export async function generateSopWithGemini(input: GenerateSopInput) {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
  const languages = normalizeLanguages(input.languages)

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 없습니다. 노출된 키는 폐기하고 새 키를 설정하세요.')
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: buildPrompt(languages),
            },
            {
              inline_data: {
                mime_type: input.mimeType,
                data: input.base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  })

  const payload = (await response.json()) as GeminiResponse

  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Gemini API 요청에 실패했습니다.')
  }

  return parseGeneratedSop(getResponseText(payload), languages)
}
