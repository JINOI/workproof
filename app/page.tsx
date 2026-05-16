'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileText, QrCode, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { type AuthMode, validateAuthForm } from '@/lib/auth/validation'

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
    <div className="flex min-h-screen bg-white">
      <section className="hidden w-1/2 flex-col justify-between bg-[#e8f3ff] p-12 lg:flex">
        <div>
          <div className="mb-16 flex items-center gap-2">
            <Shield className="h-8 w-8 text-[#3182f6]" />
            <span className="text-xl font-bold text-[#333d4b]">WorkProof</span>
          </div>

          <div className="max-w-lg space-y-4">
            <p className="text-sm font-medium text-[#3182f6]">SOP 교육 이수 증빙</p>
            <h1 className="text-balance text-4xl font-bold leading-tight text-[#333d4b]">
              현장 교육을 만들고,
              <br />
              이수 기록을 바로 남기세요.
            </h1>
            <p className="text-[#6b7684]">
              SOP 문서를 교육 카드와 퀴즈로 정리하고, 근로자는 QR 링크로 교육을 완료합니다.
              관리자는 대시보드에서 이수 상태를 확인할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {[
            { icon: FileText, label: 'SOP 등록' },
            { icon: QrCode, label: 'QR 교육 링크' },
            { icon: CheckCircle2, label: '이수 기록 저장' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <item.icon className="h-5 w-5 text-[#3182f6]" />
              </div>
              <span className="text-xs text-[#6b7684]">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex w-full flex-col lg:w-1/2">
        <div className="flex justify-end p-6">
          <Button variant="ghost" className="text-[#3182f6]" onClick={() => router.push('/education/sop-001')}>
            근로자 교육 화면 보기
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-lg">
            <CardHeader className="text-center lg:text-left">
              <div className="mb-4 flex items-center gap-2 lg:hidden">
                <Shield className="h-6 w-6 text-[#3182f6]" />
                <span className="text-lg font-bold text-[#333d4b]">WorkProof</span>
              </div>
              <CardTitle className="text-2xl text-[#333d4b]">{isSignUp ? '관리자 계정 만들기' : '관리자 로그인'}</CardTitle>
              <CardDescription className="text-[#6b7684]">
                {isSignUp ? '새 WorkProof 관리자 계정을 생성합니다.' : '가입한 이메일과 비밀번호로 접속하세요.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid grid-cols-2 rounded-md bg-[#f2f4f6] p-1">
                <Button
                  type="button"
                  variant={mode === 'sign-in' ? 'default' : 'ghost'}
                  className={mode === 'sign-in' ? 'bg-white text-[#333d4b] shadow-sm hover:bg-white' : 'text-[#6b7684]'}
                  onClick={() => {
                    setMode('sign-in')
                    setErrorMessage(null)
                    setStatusMessage(null)
                  }}
                >
                  로그인
                </Button>
                <Button
                  type="button"
                  variant={mode === 'sign-up' ? 'default' : 'ghost'}
                  className={mode === 'sign-up' ? 'bg-white text-[#333d4b] shadow-sm hover:bg-white' : 'text-[#6b7684]'}
                  onClick={() => {
                    setMode('sign-up')
                    setErrorMessage(null)
                    setStatusMessage(null)
                  }}
                >
                  회원가입
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-[#333d4b]">
                        이름
                      </Label>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="홍길동"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        className="h-12 border-[#e5e8eb] focus:border-[#3182f6] focus:ring-[#3182f6]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizationName" className="text-[#333d4b]">
                        회사/현장명
                      </Label>
                      <Input
                        id="organizationName"
                        type="text"
                        placeholder="워크프루프 현장"
                        value={organizationName}
                        onChange={(event) => setOrganizationName(event.target.value)}
                        className="h-12 border-[#e5e8eb] focus:border-[#3182f6] focus:ring-[#3182f6]"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#333d4b]">
                    이메일
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="manager@workproof.kr"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 border-[#e5e8eb] focus:border-[#3182f6] focus:ring-[#3182f6]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#333d4b]">
                    비밀번호
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder="6자 이상"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 border-[#e5e8eb] focus:border-[#3182f6] focus:ring-[#3182f6]"
                  />
                </div>

                {errorMessage && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>}
                {statusMessage && <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-[#1b64da]">{statusMessage}</p>}

                <Button type="submit" className="h-12 w-full bg-[#3182f6] font-medium text-white hover:bg-[#1b64da]" disabled={isLoading}>
                  {isLoading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
