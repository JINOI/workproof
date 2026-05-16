import { NextResponse } from 'next/server'

import { getPublicEducationByToken } from '@/lib/workproof/repository'

export async function GET(_request: Request, { params }: { params: Promise<{ publicToken: string }> }) {
  const { publicToken } = await params
  const education = await getPublicEducationByToken(publicToken)

  return NextResponse.json({ education })
}
