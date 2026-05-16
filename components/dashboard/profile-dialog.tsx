'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ProfileForm = {
  displayName: string
  organizationName: string
  email: string
  password: string
}

const emptyForm: ProfileForm = {
  displayName: '',
  organizationName: '',
  email: '',
  password: '',
}

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    let isMounted = true

    async function loadProfile() {
      setIsLoading(true)
      setErrorMessage(null)
      setStatusMessage(null)

      try {
        const response = await fetch('/api/profile', { cache: 'no-store', credentials: 'same-origin' })

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string }
          throw new Error(payload.error ?? '프로필을 불러오지 못했습니다.')
        }

        const payload = (await response.json()) as {
          profile: { displayName: string; organizationName: string; email: string }
        }

        if (isMounted) {
          setForm({
            displayName: payload.profile.displayName,
            organizationName: payload.profile.organizationName,
            email: payload.profile.email,
            password: '',
          })
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : '프로필을 불러오지 못했습니다.')
          setForm(emptyForm)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [open])

  const handleClose = () => {
    if (isSaving) {
      return
    }

    onOpenChange(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const payload = (await response.json()) as {
        error?: string
        message?: string
        profile?: { displayName: string; organizationName: string; email: string }
      }

      if (!response.ok) {
        throw new Error(payload.error ?? '프로필을 저장하지 못했습니다.')
      }

      if (payload.profile) {
        setForm({ ...payload.profile, password: '' })
      }

      setStatusMessage(payload.message ?? '프로필을 저장했습니다.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '프로필을 저장하지 못했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md">
        <DialogHeader className="space-y-1 border-b border-[#e5e8eb] px-6 py-5 text-left">
          <DialogTitle className="text-lg font-bold text-[#333d4b]">프로필</DialogTitle>
          <DialogDescription className="text-sm text-[#6b7684]">저장된 계정 정보를 확인하고 수정할 수 있습니다.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-[#6b7684]">프로필을 불러오는 중입니다...</p>
          </div>
        ) : (
          <div className="space-y-5 px-6 py-5">
            <ProfileField
              id="profile-display-name"
              label="이름"
              value={form.displayName}
              onChange={(value) => setForm((prev) => ({ ...prev, displayName: value }))}
              placeholder="홍길동"
            />
            <ProfileField
              id="profile-organization-name"
              label="회사/현장명"
              value={form.organizationName}
              onChange={(value) => setForm((prev) => ({ ...prev, organizationName: value }))}
              placeholder="SafeBridge 현장"
            />
            <ProfileField
              id="profile-email"
              label="이메일"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
              placeholder="manager@safebridge.kr"
            />
            <ProfileField
              id="profile-password"
              label="비밀번호"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
              placeholder="변경 시에만 입력"
              hint="비밀번호를 바꾸지 않으면 비워 두세요."
            />

            {errorMessage && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>}
            {statusMessage && <p className="rounded-lg bg-[#e8f2fa] px-3 py-2 text-sm text-primary">{statusMessage}</p>}
          </div>
        )}

        <div className="flex gap-2 border-t border-[#e5e8eb] px-6 py-4">
          <Button type="button" variant="outline" className="h-11 flex-1 border-[#e5e8eb]" onClick={handleClose} disabled={isSaving}>
            닫기
          </Button>
          <Button type="button" className="h-11 flex-1 bg-primary text-white hover:bg-primary/90" onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProfileField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  type?: string
  autoComplete?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-[#333d4b]">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 border-[#e5e8eb] bg-[#f9fafb] text-sm focus:border-primary focus:ring-primary"
      />
      {hint && <p className="text-xs text-[#8b95a1]">{hint}</p>}
    </div>
  )
}
