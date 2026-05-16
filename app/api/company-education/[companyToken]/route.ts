import { NextResponse } from 'next/server'
import { z } from 'zod'

import { listCompanyEducationSops } from '@/lib/workproof/repository'

const companyTokenSchema = z.string().uuid()

export async function GET(_request: Request, { params }: { params: Promise<{ companyToken: string }> }) {
  const { companyToken } = await params
  const parsedToken = companyTokenSchema.safeParse(companyToken)

  if (!parsedToken.success) {
    return NextResponse.json({ error: '유효하지 않은 회사 QR입니다.' }, { status: 400 })
  }

  const sops = await listCompanyEducationSops(parsedToken.data)

  return NextResponse.json({
    company: {
      token: parsedToken.data,
    },
    sops,
  })
}
