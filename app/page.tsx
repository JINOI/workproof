'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { LandingHeroPanel } from '@/components/landing/landing-hero-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function LandingPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

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

      router.push('/dashboard')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="landing-page relative min-h-screen">
      <div className="landing-page-gradient pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="relative flex flex-1 flex-col">
          <LandingHeroPanel />

          <div className="flex items-end justify-center px-4 pb-6 sm:px-6 sm:pb-8 lg:absolute lg:bottom-10 lg:right-10 lg:justify-end lg:p-0 xl:bottom-12 xl:right-12">
            <Card className="w-full max-w-[720px] border border-white/60 bg-white/90 shadow-lg backdrop-blur-md sm:max-w-[760px]">
              <CardHeader className="space-y-2 px-8 pb-4 pt-8">
                <CardTitle className="text-2xl text-[#333d4b]">
                  {isSignUp ? '관리자 계정 만들기' : '관리자 로그인'}
                </CardTitle>
                <CardDescription className="text-sm text-[#6b7684]">
                  {isSignUp ? '새 SafeBridge 관리자 계정을 생성합니다.' : '가입한 이메일과 비밀번호로 접속하세요.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-10 pt-0">
                <div className="mb-6 flex border-b border-[#e5e8eb]" role="tablist" aria-label="로그인 방식 선택">
                  {(
                    [
                      { value: 'sign-in' as const, label: '로그인' },
                      { value: 'sign-up' as const, label: '회원가입' },
                    ] as const
                  ).map((tab) => {
                    const isActive = mode === tab.value

                    return (
                      <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={cn(
                          'flex-1 border-b-2 px-3 pb-3 pt-2 text-base font-medium transition-colors',
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

                <form onSubmit={handleSubmit} className="space-y-5">
                  {isSignUp && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="displayName" className="text-sm text-[#333d4b]">
                          이름
                        </Label>
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="홍길동"
                          value={displayName}
                          onChange={(event) => setDisplayName(event.target.value)}
                          className="h-12 border-[#e5e8eb] text-base focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organizationName" className="text-sm text-[#333d4b]">
                          회사/현장명
                        </Label>
                        <Input
                          id="organizationName"
                          type="text"
                          placeholder="SafeBridge 현장"
                          value={organizationName}
                          onChange={(event) => setOrganizationName(event.target.value)}
                          className="h-12 border-[#e5e8eb] text-base focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-[#333d4b]">
                      이메일
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="manager@safebridge.kr"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 border-[#e5e8eb] text-base focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm text-[#333d4b]">
                      비밀번호
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      placeholder="6자 이상"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 border-[#e5e8eb] text-base focus:border-primary focus:ring-primary"
                    />
                  </div>

                  {errorMessage && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
                  )}
                  {statusMessage && (
                    <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-[#1b64da]">{statusMessage}</p>
                  )}

                  <Button
                    type="submit"
                    className="mt-2 h-12 w-full bg-primary text-base font-medium text-white hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
