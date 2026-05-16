'use client'

import { useMemo, useState } from 'react'
import { Check, Loader2, Share2, Upload } from 'lucide-react'

import { QrCodeLink, useQrDestinationUrl } from '@/components/qr-code-link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SUPPORTED_LANGUAGES } from '@/lib/workproof/languages'

interface NewSOPModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

type Step = 'upload' | 'processing' | 'complete'

type CreatedSop = {
  id: string
  title: string
  public_token: string
  languages: string[]
}

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'SOP 생성에 실패했습니다.'
}

export function NewSOPModal({ open, onOpenChange, onCreated }: NewSOPModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['ko', 'vi'])
  const [file, setFile] = useState<File | null>(null)
  const [createdSop, setCreatedSop] = useState<CreatedSop | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createdPath = createdSop ? `/education/${createdSop.public_token}` : ''
  const shareUrl = useQrDestinationUrl(createdPath)
  const selectedLanguageLabels = useMemo(
    () =>
      selectedLanguages
        .map((id) => SUPPORTED_LANGUAGES.find((language) => language.code === id)?.label)
        .filter(Boolean)
        .join(', '),
    [selectedLanguages],
  )

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    setErrorMessage(null)

    if (selectedFile && selectedFile.size > MAX_UPLOAD_BYTES) {
      setFile(null)
      event.target.value = ''
      setErrorMessage('파일은 20MB 이하만 업로드할 수 있습니다.')
      return
    }

    setFile(selectedFile ?? null)
  }

  const handleUpload = async () => {
    if (!file || selectedLanguages.length === 0) return

    setStep('processing')
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('languages', JSON.stringify(selectedLanguages))

      const response = await fetch('/api/sops', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      })
      const payload = (await response.json()) as { sop?: CreatedSop; error?: string }

      if (!response.ok || !payload.sop) {
        throw new Error(payload.error ?? 'SOP 생성에 실패했습니다.')
      }

      setCreatedSop(payload.sop)
      setStep('complete')
      onCreated?.()
    } catch (error) {
      setStep('upload')
      setErrorMessage(getErrorMessage(error))
    }
  }

  const handleClose = () => {
    if (step === 'processing') return
    setStep('upload')
    setFile(null)
    setCreatedSop(null)
    setErrorMessage(null)
    onOpenChange(false)
  }

  const handleShareQr = async () => {
    if (!shareUrl) return
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'WorkProof 안전 교육',
          text: '아래 링크에서 안전 교육을 진행해 주세요.',
          url: shareUrl,
        })
        return
      }
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // Share and clipboard can be cancelled or blocked by the browser.
    }
  }

  const toggleLanguage = (langId: string) => {
    setSelectedLanguages((prev) => (prev.includes(langId) ? prev.filter((id) => id !== langId) : [...prev, langId]))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#333d4b]">
            {step === 'upload' && 'SOP 문서 업로드'}
            {step === 'processing' && 'AI 생성 중'}
            {step === 'complete' && '교육 콘텐츠 생성 완료'}
          </DialogTitle>
          <DialogDescription className="text-[#6b7684]">
            {step === 'upload' && '문서를 업로드하면 Gemini가 교육 카드, 다국어 퀴즈, QR 링크를 생성합니다.'}
            {step === 'processing' && '문서를 분석하고 작업 단계, 위험요소, 보호구, 금지행동을 정리하고 있습니다.'}
            {step === 'complete' && '현장에 QR을 공유하면 근로자가 바로 교육을 시작할 수 있습니다.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="sop-file" className="text-[#333d4b]">
                문서 파일
              </Label>
              <div className="rounded-lg border-2 border-dashed border-[#e5e8eb] p-8 text-center transition-colors hover:border-[#3182f6]">
                <Input
                  id="sop-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="sop-file" className="cursor-pointer">
                  <Upload className="mx-auto mb-3 h-10 w-10 text-[#8b95a1]" />
                  {file ? (
                    <p className="break-all font-medium text-[#3182f6]">{file.name}</p>
                  ) : (
                    <>
                      <p className="mb-1 text-[#6b7684]">업로드할 SOP 문서를 선택하세요.</p>
                      <p className="text-xs text-[#8b95a1]">PDF, DOC, DOCX, TXT 최대 20MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[#333d4b]">교육 언어</Label>
              <div className="flex flex-wrap gap-3">
                {SUPPORTED_LANGUAGES.map((language) => (
                  <label key={language.code} className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={selectedLanguages.includes(language.code)}
                      onCheckedChange={() => toggleLanguage(language.code)}
                    />
                    <span className="text-sm text-[#333d4b]">{language.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {errorMessage && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>}

            <Button
              onClick={handleUpload}
              disabled={!file || selectedLanguages.length === 0}
              className="w-full bg-[#3182f6] text-white hover:bg-[#1b64da]"
            >
              업로드하고 AI 생성
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#3182f6]" />
            <p className="text-center text-[#6b7684]">
              SOP 문서를 분석하는 중입니다.
              <br />
              파일 크기에 따라 잠시 걸릴 수 있습니다.
            </p>
          </div>
        )}

        {step === 'complete' && createdSop && (
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <QrCodeLink path={createdPath} size={176} />
            </div>

            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2 text-[#00d082]">
                <Check className="h-5 w-5" />
                <span className="font-medium">생성 완료</span>
              </div>
              <p className="text-sm font-medium text-[#333d4b]">{createdSop.title}</p>
              <p className="text-sm text-[#6b7684]">선택 언어: {selectedLanguageLabels}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-[#e5e8eb]" onClick={handleClose}>
                닫기
              </Button>
              <Button
                type="button"
                className="flex-1 bg-[#3182f6] text-white hover:bg-[#1b64da]"
                onClick={handleShareQr}
                disabled={!shareUrl}
              >
                <Share2 className="mr-2 h-4 w-4" />
                QR 공유
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
