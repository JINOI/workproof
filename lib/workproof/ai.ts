import { z } from 'zod'

import type { Json } from '@/lib/supabase/database.types'
import { SUPPORTED_LANGUAGE_CODES, SUPPORTED_LANGUAGES, type SupportedLanguageCode } from './languages.ts'

const educationCardSchema = z.object({
  language: z.string(),
  position: z.number().int().positive(),
  title: z.string().min(1),
  content: z.string().min(1),
  icon: z.enum(['warning', 'safety', 'prohibited', 'equipment']),
})

const summaryCardSchema = z.object({
  position: z.number().int().positive(),
  title: z.string().min(1),
  content: z.string().min(1),
  icon: z.enum(['warning', 'safety', 'prohibited', 'equipment']),
})

const summaryListSchema = z.array(z.string()).optional().default([])

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
    sourceLanguage: z.string().min(1),
    documentSummary: z.string().min(1),
    cards: z.array(summaryCardSchema).min(1),
    workSteps: summaryListSchema,
    hazards: summaryListSchema,
    protectiveEquipment: summaryListSchema,
    prohibitedActions: summaryListSchema,
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
    'Read the attached SOP document and generate training content for workers.',
    '',
    `Target languages: ${targetLanguages}.`,
    '',
    'Generation pipeline:',
    '1. Read the attached SOP/PDF first.',
    '2. Create a canonical Korean education summary from the document.',
    '3. Convert that canonical summary into worker-facing education cards. Use at most 10 cards total.',
    '4. Translate those exact cards into each target language. Do not add cards during translation.',
    '5. Create quizzes from the translated education cards only, so the worker can answer after studying the cards.',
    '',
    'Return only valid JSON. Do not wrap it in Markdown.',
    'Schema:',
    '{',
    '  "title": "short SOP title in Korean",',
    '  "description": "one sentence Korean description",',
    '  "summary": {',
    '    "sourceLanguage": "ko",',
    '    "documentSummary": "short Korean summary of the original document",',
    '    "cards": [',
    '      { "position": 1, "title": "Korean card title", "content": "Korean card content", "icon": "warning|safety|prohibited|equipment" }',
    '    ],',
    '    "workSteps": ["..."],',
    '    "hazards": ["..."],',
    '    "protectiveEquipment": ["..."],',
    '    "prohibitedActions": ["..."]',
    '  },',
    '  "educationCards": [',
    '    { "language": "ko", "position": 1, "title": "translated card title", "content": "translated card content", "icon": "warning|safety|prohibited|equipment" }',
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
    '- summary.cards is the server-stored education summary material. It must be derived from the uploaded document before translation or quiz generation.',
    '- summary.cards must contain 1 to 10 cards. Never create more than 10 cards, even for long documents.',
    '- Every summary list must contain at least one item. If protective equipment is not explicit, include a conservative PPE item such as wearing required site protective equipment.',
    '- educationCards must be translations of summary.cards for each target language. Keep the same positions and icons as summary.cards.',
    '- Prefer 4 to 8 cards when the document is ordinary length; use up to 10 only when the SOP has enough distinct safety topics.',
    '- Create exactly 10 quiz questions per language.',
    '- Mix O/X and multiple-choice questions.',
    '- Multiple-choice correctAnswer must be the exact option text, not an index.',
    '- Keep worker-facing text short, concrete, and easy to understand.',
    '- Quiz questions must be answerable from educationCards. Do not test details that are absent from the cards.',
    '- Do not invent hazards that conflict with the document. If the document is sparse, create conservative general safety cards from the available content.',
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

function normalizeSummaryList(values: string[], fallback: string) {
  const normalized = values.map((value) => value.trim()).filter(Boolean)
  return normalized.length > 0 ? normalized : [fallback]
}

function normalizeGeneratedSop(value: GeneratedSop, languages: SupportedLanguageCode[]): GeneratedSop {
  const allowedLanguages = new Set(languages)
  const cards = [...value.summary.cards]
    .sort((left, right) => left.position - right.position)
    .slice(0, 10)
    .map((card, index) => ({
      ...card,
      position: index + 1,
    }))

  const educationCards = languages.flatMap((language) =>
    value.educationCards
      .filter((card) => card.language === language)
      .sort((left, right) => left.position - right.position)
      .slice(0, cards.length)
      .map((card, index) => ({
        ...card,
        position: index + 1,
      })),
  )
  const quizQuestions = value.quizQuestions
    .filter((question) => allowedLanguages.has(question.language as SupportedLanguageCode))
    .sort((left, right) => left.position - right.position)
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
    summary: {
      ...value.summary,
      cards,
      workSteps: normalizeSummaryList(value.summary.workSteps, '문서의 작업 절차를 확인하고 현장 지시에 따라 작업합니다.'),
      hazards: normalizeSummaryList(value.summary.hazards, '작업 전 주변 위험요소를 확인합니다.'),
      protectiveEquipment: normalizeSummaryList(value.summary.protectiveEquipment, '작업에 필요한 개인보호구를 착용합니다.'),
      prohibitedActions: normalizeSummaryList(value.summary.prohibitedActions, '문서와 현장 안전수칙에서 금지한 행동을 하지 않습니다.'),
    },
    educationCards,
    quizQuestions: languages.flatMap((language) =>
      quizQuestions
        .filter((question) => question.language === language)
        .slice(0, 10)
        .map((question, index) => ({
          ...question,
          position: index + 1,
        })),
    ),
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
