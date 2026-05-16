import { NextResponse } from 'next/server'

import { deleteSop, getSopForManager } from '@/lib/workproof/repository'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sop = await getSopForManager(id)

  return NextResponse.json({ sop })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const sop = await deleteSop(id)

    if (!sop) {
      return NextResponse.json({ error: '삭제할 안전 관리 가이드를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ deletedSopId: sop.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : '안전 관리 가이드를 삭제하지 못했습니다.'
    const status = message === 'Authentication required' ? 401 : 500

    return NextResponse.json({ error: status === 401 ? '로그인이 필요합니다.' : message }, { status })
  }
}
