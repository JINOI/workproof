'use client'

import { useCallback, useEffect, useState } from 'react'
import { Copy, QrCode, Share2 } from 'lucide-react'

import { QrCodeLink, useQrDestinationUrl } from '@/components/qr-code-link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export type CompanyQr = {
  organizationName: string | null
  companyPublicToken: string
  educationPath: string
}

type CompanyQrResponse = {
  companyQr?: CompanyQr
  error?: string
}

export function useCompanyQr() {
  const [companyQr, setCompanyQr] = useState<CompanyQr | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadCompanyQr = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/company-qr', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const payload = (await response.json()) as CompanyQrResponse

      if (!response.ok || !payload.companyQr) {
        throw new Error(payload.error ?? '회사 QR을 불러오지 못했습니다.')
      }

      setCompanyQr(payload.companyQr)
      setErrorMessage(null)
    } catch (error) {
      setCompanyQr(null)
      setErrorMessage(error instanceof Error ? error.message : '회사 QR을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompanyQr()
  }, [loadCompanyQr])

  return { companyQr, isLoading, errorMessage, reload: loadCompanyQr }
}

function CompanyQrActions({ shareUrl, disabled }: { shareUrl: string; disabled?: boolean }) {
  const [copyLabel, setCopyLabel] = useState('링크 복사')

  async function handleCopy() {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyLabel('복사됨')
      window.setTimeout(() => setCopyLabel('링크 복사'), 1500)
    } catch {
      setCopyLabel('복사 실패')
      window.setTimeout(() => setCopyLabel('링크 복사'), 1500)
    }
  }

  async function handleShare() {
    if (!shareUrl) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'WorkProof 회사 교육 QR',
          text: 'QR 링크에서 교육자료를 선택하고 안전 교육을 진행해 주세요.',
          url: shareUrl,
        })
        return
      }

      await navigator.clipboard.writeText(shareUrl)
      setCopyLabel('복사됨')
      window.setTimeout(() => setCopyLabel('링크 복사'), 1500)
    } catch {
      // Native share can be cancelled by the user.
    }
  }

  return (
    <div className="flex gap-2">
      <Button type="button" variant="outline" className="flex-1 border-[#e5e8eb]" onClick={handleCopy} disabled={disabled || !shareUrl}>
        <Copy className="mr-2 h-4 w-4" />
        {copyLabel}
      </Button>
      <Button type="button" className="flex-1 bg-[#3182f6] text-white hover:bg-[#1b64da]" onClick={handleShare} disabled={disabled || !shareUrl}>
        <Share2 className="mr-2 h-4 w-4" />
        공유
      </Button>
    </div>
  )
}

export function CompanyQrContent({ companyQr, isLoading, errorMessage }: { companyQr: CompanyQr | null; isLoading: boolean; errorMessage: string | null }) {
  const shareUrl = useQrDestinationUrl(companyQr?.educationPath ?? '')

  if (isLoading) {
    return <div className="rounded-lg border border-dashed border-[#e5e8eb] p-6 text-center text-sm text-[#6b7684]">회사 QR을 불러오는 중입니다...</div>
  }

  if (errorMessage || !companyQr) {
    return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage ?? '회사 QR을 불러오지 못했습니다.'}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <QrCodeLink path={companyQr.educationPath} size={164} />
      </div>
      <div className="space-y-1 text-center">
        <p className="font-medium text-[#333d4b]">{companyQr.organizationName ?? '회사 교육 QR'}</p>
        <p className="break-all text-xs text-[#8b95a1]">{shareUrl || companyQr.educationPath}</p>
      </div>
      <CompanyQrActions shareUrl={shareUrl} disabled={!shareUrl} />
    </div>
  )
}

export function CompanyQrPanel() {
  const { companyQr, isLoading, errorMessage } = useCompanyQr()

  return (
    <Card className="border border-border">
      <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f3ff]">
              <QrCode className="h-5 w-5 text-[#3182f6]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#333d4b]">회사 공용 QR</h2>
              <p className="text-sm text-[#6b7684]">근로자는 이 QR에서 교육자료를 선택한 뒤 교육을 진행합니다.</p>
            </div>
          </div>
        </div>
        <div className="w-full md:w-[240px]">
          <CompanyQrContent companyQr={companyQr} isLoading={isLoading} errorMessage={errorMessage} />
        </div>
      </CardContent>
    </Card>
  )
}

export function CompanyQrDialogButton({ disabled = false }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const { companyQr, isLoading, errorMessage } = useCompanyQr()

  return (
    <>
      <Button type="button" variant="outline" className="w-full whitespace-nowrap border-[#e5e8eb] sm:w-auto" disabled={disabled} onClick={() => setOpen(true)}>
        <QrCode className="mr-2 h-4 w-4" />
        회사 QR코드 확인하기
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>회사 공용 QR</DialogTitle>
            <DialogDescription>근로자는 이 QR에서 교육자료를 선택해서 교육을 시작합니다.</DialogDescription>
          </DialogHeader>
          <CompanyQrContent companyQr={companyQr} isLoading={isLoading} errorMessage={errorMessage} />
        </DialogContent>
      </Dialog>
    </>
  )
}
