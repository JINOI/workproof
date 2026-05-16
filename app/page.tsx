'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { LandingHeroPanel } from '@/components/landing/landing-hero-panel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type AuthMode, validateAuthForm } from '@/lib/auth/validation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

function getAuthErrorMessage(message: string) {
  if (message.toLowerCase().includes('invalid login credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.'
  }

  if (message.toLowerCase().includes('already registered')) {
    return '이미 가입된 이메일입니다. 로그인해 주세요.'
  }

  return message
}

const authTabs = [
  { value: 'sign-in' as const, label: '로그인' },
  { value: 'sign-up' as const, label: '회원가입' },
] as const

export default function LandingPage() {
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const openAuth = (nextMode: AuthMode) => {
    setMode(nextMode)
    setErrorMessage(null)
    setStatusMessage(null)
    setAuthOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    const validationError = validateAuthForm({ mode, email, password })
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const trimmedEmail = email.trim()

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              display_name: displayName.trim() || null,
              organization_name: organizationName.trim() || null,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        })

        if (error) {
          setErrorMessage(getAuthErrorMessage(error.message))
          return
        }

        if (data.session) {
          setAuthOpen(false)
          router.push('/dashboard')
          router.refresh()
          return
        }

        setStatusMessage('가입 확인 이메일을 보냈습니다. 메일 확인 후 로그인해 주세요.')
        setMode('sign-in')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (error) {
        setErrorMessage(getAuthErrorMessage(error.message))
        return
      }

      setAuthOpen(false)
      router.push('/dashboard')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="landing-page relative min-h-screen">
      <div className="landing-page-bg pointer-events-none absolute inset-0" aria-hidden>
        <div className="landing-page-gradient absolute inset-0" />
        <div className="landing-page-orb landing-page-orb--blue" />
        <div className="landing-page-orb landing-page-orb--green" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="landing-nav">
          <nav className="landing-nav-float landing-lift" aria-label="상단 메뉴">
            <div className="flex items-center rounded-xl bg-white/40 p-0.5" role="tablist" aria-label="관리자 인증">
              {authTabs.map((tab) => {
                const isActive = authOpen && mode === tab.value

                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={cn(
                      'rounded-[14px] px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out sm:px-4 sm:py-2',
                      isActive
                        ? 'bg-[var(--brand-blue)] text-white shadow-sm'
                        : 'text-[#6b7684] hover:bg-white/80 hover:text-[#333d4b]',
                    )}
                    onClick={() => openAuth(tab.value)}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </nav>
        </header>

        <main className="flex min-h-0 flex-1 flex-col">
          <LandingHeroPanel />
        </main>
      </div>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-w-[380px] gap-0 border-white/60 bg-white/95 p-0 shadow-xl backdrop-blur-md sm:max-w-[400px]">
          <DialogHeader className="space-y-1 border-b border-[#e5e8eb] px-5 pb-3 pt-5 text-left">
            <DialogTitle className="text-lg text-[#333d4b]">
              {isSignUp ? '관리자 계정 만들기' : '관리자 로그인'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6b7684]">
              {isSignUp ? '새 SafeBridge 관리자 계정을 생성합니다.' : '가입한 이메일과 비밀번호로 접속하세요.'}
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 pt-4">
            <div className="mb-5 flex border-b border-[#e5e8eb]" role="tablist" aria-label="로그인 방식 선택">
              {authTabs.map((tab) => {
                const isActive = mode === tab.value

                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={cn(
                      'flex-1 border-b-2 px-2 pb-2.5 pt-1 text-sm font-medium transition-all duration-200 ease-in-out',
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-[#8b95a1] hover:border-[#d1d6db] hover:text-[#333d4b]',
                    )}
                    onClick={() => {
                      setMode(tab.value)
                      setErrorMessage(null)
                      setStatusMessage(null)
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 pb-6">
              {isSignUp && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName" className="text-xs text-[#333d4b]">
                      이름
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="홍길동"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      className="h-9 border-[#e5e8eb] text-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="organizationName" className="text-xs text-[#333d4b]">
                      회사/현장명
                    </Label>
                    <Input
                      id="organizationName"
                      type="text"
                      placeholder="SafeBridge 현장"
                      value={organizationName}
                      onChange={(event) => setOrganizationName(event.target.value)}
                      className="h-9 border-[#e5e8eb] text-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-[#333d4b]">
                  이메일
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="manager@safebridge.kr"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-9 border-[#e5e8eb] text-sm focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-[#333d4b]">
                  비밀번호
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder="6자 이상"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-9 border-[#e5e8eb] text-sm focus:border-primary focus:ring-primary"
                />
              </div>

              {errorMessage && (
                <p className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{errorMessage}</p>
              )}
              {statusMessage && (
                <p className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs text-[#1b64da]">{statusMessage}</p>
              )}

              <Button
                type="submit"
                size="sm"
                className="landing-lift landing-lift-primary mt-1 h-9 w-full bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:pointer-events-none disabled:transform-none disabled:shadow-none"
                disabled={isLoading}
              >
                {isLoading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
