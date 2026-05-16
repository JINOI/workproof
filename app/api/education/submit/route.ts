import { NextResponse } from 'next/server'
import { ZodError, z } from 'zod'

import type { Json } from '@/lib/supabase/database.types'
import { submitEducationResult } from '@/lib/workproof/repository'

const submitEducationSchema = z.object({
  sopId: z.string().uuid(),
  workerName: z.string().min(1),
  workerBirthDate: z.string().date(),
  language: z.string().min(2).optional(),
  attempts: z.number().int().positive(),
  elapsedSeconds: z.number().int().nonnegative(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedAnswer: z.unknown().transform((value) => value as Json),
      isCorrect: z.boolean(),
      attempt: z.number().int().positive().optional(),
    }),
  ),
  passed: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const payload = submitEducationSchema.parse(await request.json())
    const log = await submitEducationResult(payload)

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: '제출 데이터가 올바르지 않습니다.' }, { status: 400 })
    }

    console.error('Failed to submit education result', error)
    return NextResponse.json({ error: '이수 결과를 저장하지 못했습니다.' }, { status: 500 })
  }
}
