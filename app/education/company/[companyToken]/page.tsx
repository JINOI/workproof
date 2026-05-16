'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Building2, ChevronRight, FileText, HardHat } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SUPPORTED_LANGUAGES } from '@/lib/workproof/languages'

type CompanySopOption = {
  id: string
  title: string
  description: string | null
  languages: string[]
  public_token: string
  created_at: string
}

function languageLabel(code: string) {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.label ?? code
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

export default function CompanyEducationPage() {
  const params = useParams<{ companyToken: string }>()
  const router = useRouter()
  const [sops, setSops] = useState<CompanySopOption[]>([])
  const [selectedToken, setSelectedToken] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadCompanyEducation() {
      try {
        const response = await fetch(`/api/company-education/${params.companyToken}`, {
          cache: 'no-store',
        })
        const payload = (await response.json()) as { sops?: CompanySopOption[]; error?: string }

        if (!response.ok || !payload.sops) {
          throw new Error(payload.error ?? '교육 목록을 불러오지 못했습니다.')
        }

        if (isMounted) {
          setSops(payload.sops)
          setSelectedToken(payload.sops[0]?.public_token ?? '')
          setLoadError(null)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : '교육 목록을 불러오지 못했습니다.')
          setSops([])
          setSelectedToken('')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadCompanyEducation()

    return () => {
      isMounted = false
    }
  }, [params.companyToken])

  const selectedSop = useMemo(() => sops.find((sop) => sop.public_token === selectedToken) ?? null, [selectedToken, sops])

  const handleStart = () => {
    if (!selectedToken) return
    router.push(`/education/${selectedToken}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f3ff]">
              <Building2 className="h-8 w-8 text-[#3182f6]" />
            </div>
            <p className="mb-2 text-sm font-medium text-[#3182f6]">WorkProof 회사 교육 QR</p>
            <h1 className="text-xl font-bold text-[#333d4b]">교육자료를 선택하세요</h1>
            <p className="mt-2 text-sm text-[#6b7684]">현장에서 진행할 안전 관리 가이드 교육을 선택하면 교육자료와 퀴즈가 시작됩니다.</p>
          </div>

          {isLoading && (
            <div className="rounded-lg border border-dashed border-[#e5e8eb] p-8 text-center text-sm text-[#6b7684]">
              교육 목록을 불러오는 중입니다...
            </div>
          )}

          {!isLoading && loadError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>}

          {!isLoading && !loadError && sops.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#e5e8eb] p-8 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-[#8b95a1]" />
              <h2 className="mb-1 font-medium text-[#333d4b]">진행 가능한 교육자료가 없습니다.</h2>
              <p className="text-sm text-[#6b7684]">관리자가 안전 관리 가이드를 등록하면 이 QR에서 선택할 수 있습니다.</p>
            </div>
          )}

          {!isLoading && !loadError && sops.length > 0 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#333d4b]">교육자료</label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="h-12 w-full border-[#e5e8eb] bg-white">
                    <SelectValue placeholder="교육자료 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {sops.map((sop) => (
                      <SelectItem key={sop.id} value={sop.public_token}>
                        {sop.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSop && (
                <div className="rounded-xl border border-[#e5e8eb] bg-white p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f3ff]">
                      <HardHat className="h-5 w-5 text-[#3182f6]" />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-xs text-[#8b95a1]">등록일 {formatDate(selectedSop.created_at)}</p>
                      <h2 className="font-semibold text-[#333d4b]">{selectedSop.title}</h2>
                    </div>
                  </div>
                  {selectedSop.description && <p className="mb-3 text-sm leading-6 text-[#6b7684]">{selectedSop.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    {selectedSop.languages.map((language) => (
                      <Badge key={language} variant="secondary" className="bg-[#f2f4f6] text-[#4e5968]">
                        {languageLabel(language)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleStart} disabled={!selectedToken} className="h-12 w-full bg-[#3182f6] text-white hover:bg-[#1b64da]">
                선택한 교육 시작
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
