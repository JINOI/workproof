import { NextResponse } from 'next/server'
import { z } from 'zod'

import { addFrequentSopTemplateToCurrentUser, listFrequentSopTemplates } from '@/lib/workproof/repository'

const addFrequentSopSchema = z.object({
  templateKey: z.string().min(1),
})

export async function GET() {
  try {
    const templates = await listFrequentSopTemplates()
    return NextResponse.json({ templates })
  } catch (error) {
    const message = error instanceof Error ? error.message : '자주 찾는 SOP를 불러오지 못했습니다.'
    const status = message.includes('Authentication') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = addFrequentSopSchema.parse(await request.json())
    const sop = await addFrequentSopTemplateToCurrentUser(body.templateKey)
    return NextResponse.json({ sop }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '자주 찾는 SOP를 추가하지 못했습니다.'
    const status = message.includes('Authentication') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
