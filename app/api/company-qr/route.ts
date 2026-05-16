import { NextResponse } from 'next/server'

import { getCompanyQrForManager } from '@/lib/workproof/repository'

export async function GET() {
  try {
    const companyQr = await getCompanyQrForManager()
    return NextResponse.json({ companyQr })
  } catch (error) {
    const message = error instanceof Error ? error.message : '회사 QR 정보를 불러오지 못했습니다.'
    const status = message === 'Authentication required' ? 401 : 500

    return NextResponse.json({ error: status === 401 ? '로그인이 필요합니다.' : message }, { status })
  }
}
