import { NextResponse } from 'next/server'

import { getSopForManager } from '@/lib/workproof/repository'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sop = await getSopForManager(id)

  return NextResponse.json({ sop })
}
