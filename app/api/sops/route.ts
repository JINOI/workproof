import { NextResponse } from 'next/server'

import { createSop, listSops } from '@/lib/workproof/repository'

export async function GET() {
  const sops = await listSops()
  return NextResponse.json({ sops })
}

export async function POST(request: Request) {
  const body = await request.json()
  const sop = await createSop(body)
  return NextResponse.json({ sop }, { status: 201 })
}
