'use client'

import { useState } from 'react'
import { Upload, Loader2, Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DEFAULT_WORKER_EDUCATION_PATH,
  QrCodeLink,
  useQrDestinationUrl,
} from '@/components/qr-code-link'

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
  const shareUrl = useQrDestinationUrl(DEFAULT_WORKER_EDUCATION_PATH)
  const [step, setStep] = useState<Step>('upload')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['ko', 'vi'])
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = () => {
    if (!file) return
    setStep('processing')
    // Simulate AI processing
    setTimeout(() => {
      setStep('complete')
    }, 2000)
  }

  const handleClose = () => {
    setStep('upload')
    setFile(null)
    onOpenChange(false)
  }

  const handleShareQr = async () => {
    if (!shareUrl) return
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'WorkProof 안전 교육',
          text: '아래 링크에서 교육을 진행해 주세요.',
          url: shareUrl,
        })
        return
      }
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // 사용자가 공유 취소 또는 clipboard 거부
    }
  }

  const toggleLanguage = (langId: string) => {
    setSelectedLanguages(prev => 
      prev.includes(langId) 
        ? prev.filter(id => id !== langId)
        : [...prev, langId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#333d4b]">
            {step === 'upload' && 'SOP 문서 업로드'}
            {step === 'processing' && 'AI 처리 중...'}
            {step === 'complete' && 'SOP 생성 완료'}
          </DialogTitle>
          <DialogDescription className="text-[#6b7684]">
            {step === 'upload' && 'PDF 또는 문서 파일을 업로드하세요'}
            {step === 'processing' && 'AI가 SOP를 분석하고 퀴즈를 생성하고 있습니다'}
            {step === 'complete' && 'QR 코드를 근로자에게 공유하세요'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="sop-file" className="text-[#333d4b]">파일 선택</Label>
              <div className="border-2 border-dashed border-[#e5e8eb] rounded-lg p-8 text-center hover:border-[#3182f6] transition-colors">
                <Input
                  id="sop-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="sop-file" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto text-[#8b95a1] mb-3" />
                  {file ? (
                    <p className="text-[#3182f6] font-medium">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-[#6b7684] mb-1">파일을 드래그하거나 클릭하여 선택</p>
                      <p className="text-xs text-[#8b95a1]">PDF, DOC, DOCX (최대 10MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[#333d4b]">번역 언어 선택</Label>
              <div className="flex flex-wrap gap-3">
                {languages.map((lang) => (
                  <label
                    key={lang.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedLanguages.includes(lang.id)}
                      onCheckedChange={() => toggleLanguage(lang.id)}
                    />
                    <span className="text-sm text-[#333d4b]">{lang.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || selectedLanguages.length === 0}
              className="w-full bg-[#3182f6] hover:bg-[#1b64da] text-white"
            >
              업로드 및 생성
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-[#3182f6] animate-spin mb-4" />
            <p className="text-[#6b7684] text-center">
              SOP 요약 및 퀴즈 생성 중...<br />
              잠시만 기다려주세요
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="py-6 space-y-6">
            <div className="flex justify-center">
              <QrCodeLink path={DEFAULT_WORKER_EDUCATION_PATH} size={176} />
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-[#00d082]">
                <Check className="h-5 w-5" />
                <span className="font-medium">생성 완료</span>
              </div>
              <p className="text-sm text-[#6b7684]">
                10개의 퀴즈가 생성되었습니다<br />
                선택한 언어: {selectedLanguages.map(id => 
                  languages.find(l => l.id === id)?.label
                ).join(', ')}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[#e5e8eb]"
                onClick={handleClose}
              >
                닫기
              </Button>
              <Button
                type="button"
                className="flex-1 bg-[#3182f6] hover:bg-[#1b64da] text-white"
                onClick={handleShareQr}
                disabled={!shareUrl}
              >
                <Share2 className="h-4 w-4 mr-2" />
                QR 공유하기
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
