import { NextResponse } from 'next/server'
import { z } from 'zod'

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
    }),
  ),
})

export async function POST(request: Request) {
  const payload = submitEducationSchema.parse(await request.json())
  const log = await submitEducationResult(payload)

  return NextResponse.json({ log }, { status: 201 })
}
