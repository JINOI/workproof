'use client'

import { useState } from 'react'
import { Check, Loader2, QrCode, Share2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NewSOPModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'upload' | 'processing' | 'complete'

const languages = [
  { id: 'ko', label: '한국어' },
  { id: 'vi', label: '베트남어' },
  { id: 'zh', label: '중국어' },
  { id: 'th', label: '태국어' },
]

export function NewSOPModal({ open, onOpenChange }: NewSOPModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['ko', 'vi'])
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = () => {
    if (!file) return
    setStep('processing')
    setTimeout(() => {
      setStep('complete')
    }, 2000)
  }

  const handleClose = () => {
    setStep('upload')
    setFile(null)
    onOpenChange(false)
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
            {step === 'processing' && 'AI 처리 중'}
            {step === 'complete' && 'SOP 생성 완료'}
          </DialogTitle>
          <DialogDescription className="text-[#6b7684]">
            {step === 'upload' && 'PDF 또는 문서를 업로드해 작업자 교육 콘텐츠를 생성합니다.'}
            {step === 'processing' && '문서를 분석하고 교육 카드와 퀴즈를 준비하고 있습니다.'}
            {step === 'complete' && 'QR 링크로 작업자 교육을 배포할 수 있습니다.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="sop-file" className="text-[#333d4b]">
                문서 파일
              </Label>
              <div className="rounded-lg border-2 border-dashed border-[#e5e8eb] p-8 text-center transition-colors hover:border-[#3182f6]">
                <Input id="sop-file" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                <label htmlFor="sop-file" className="cursor-pointer">
                  <Upload className="mx-auto mb-3 h-10 w-10 text-[#8b95a1]" />
                  {file ? (
                    <p className="font-medium text-[#3182f6]">{file.name}</p>
                  ) : (
                    <>
                      <p className="mb-1 text-[#6b7684]">업로드할 SOP 문서를 선택하세요.</p>
                      <p className="text-xs text-[#8b95a1]">PDF, DOC, DOCX 최대 10MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[#333d4b]">교육 언어</Label>
              <div className="flex flex-wrap gap-3">
                {languages.map((lang) => (
                  <label key={lang.id} className="flex cursor-pointer items-center gap-2">
                    <Checkbox checked={selectedLanguages.includes(lang.id)} onCheckedChange={() => toggleLanguage(lang.id)} />
                    <span className="text-sm text-[#333d4b]">{lang.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || selectedLanguages.length === 0}
              className="w-full bg-[#3182f6] text-white hover:bg-[#1b64da]"
            >
              업로드하고 생성
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#3182f6]" />
            <p className="text-center text-[#6b7684]">
              SOP 문서를 분석하는 중입니다.
              <br />
              잠시만 기다려 주세요.
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-[#f2f4f6]">
                <QrCode className="h-32 w-32 text-[#333d4b]" />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2 text-[#00d082]">
                <Check className="h-5 w-5" />
                <span className="font-medium">생성 완료</span>
              </div>
              <p className="text-sm text-[#6b7684]">
                선택한 언어: {selectedLanguages.map((id) => languages.find((lang) => lang.id === id)?.label).join(', ')}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-[#e5e8eb]" onClick={handleClose}>
                닫기
              </Button>
              <Button className="flex-1 bg-[#3182f6] text-white hover:bg-[#1b64da]">
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
