'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, QrCode, FileText, CheckCircle2 } from 'lucide-react'
import { DEFAULT_WORKER_EDUCATION_PATH, QrCodeLink } from '@/components/qr-code-link'

export default function LandingPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate login - will be replaced with Supabase auth
    setTimeout(() => {
      router.push('/dashboard')
    }, 500)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#e8f3ff] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <Shield className="h-8 w-8 text-[#3182f6]" />
            <span className="text-xl font-bold text-[#333d4b]">WorkProof</span>
          </div>
          
          <div className="space-y-2 mb-8">
            <p className="text-sm text-[#3182f6] font-medium">최초의 근로자 안전 교육 솔루션</p>
            <h1 className="text-4xl font-bold text-[#333d4b] leading-tight text-balance">
              언어 장벽을 넘는<br />
              안전 교육의 새로운 표준
            </h1>
            <p className="text-[#6b7684] mt-4 max-w-md">
              SOP를 AI로 요약하여(다국어화하고, 퀴즈로 이해도를 검증하여 법적 증 빙까지 한 번에 처리합니다.
            </p>
          </div>
        </div>

        <div className="space-y-10">
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#3182f6]" />
              </div>
              <span className="text-xs text-[#6b7684]">1.문서와 파일</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <QrCode className="h-5 w-5 text-[#3182f6]" />
              </div>
              <span className="text-xs text-[#6b7684]">QR 퀵스 접속</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-[#3182f6]" />
              </div>
              <span className="text-xs text-[#6b7684]">증빙 리포트</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <p className="text-sm font-medium text-[#333d4b]">근로자 교육 화면 QR</p>
            <QrCodeLink path={DEFAULT_WORKER_EDUCATION_PATH} size={168} />
          </div>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="flex justify-end p-6">
          <Button 
            variant="ghost" 
            className="text-[#3182f6]"
            onClick={() => router.push(DEFAULT_WORKER_EDUCATION_PATH)}
          >
            근로자 QR 체험하기 &rarr;
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <Card className="w-full max-w-md border-0 shadow-none lg:shadow-lg lg:border">
            <CardHeader className="text-center lg:text-left">
              <div className="flex items-center gap-2 mb-4 lg:hidden">
                <Shield className="h-6 w-6 text-[#3182f6]" />
                <span className="text-lg font-bold text-[#333d4b]">WorkProof</span>
              </div>
              <CardTitle className="text-2xl text-[#333d4b]">관리자 로그인</CardTitle>
              <CardDescription className="text-[#6b7684]">
                안전관리자 계정으로 로그인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#333d4b]">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="manager@workproof.kr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-[#e5e8eb] focus:border-[#3182f6] focus:ring-[#3182f6]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#333d4b]">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-[#e5e8eb] focus:border-[#3182f6] focus:ring-[#3182f6]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#3182f6] hover:bg-[#1b64da] text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? '로그인 중...' : '로그인'}
                </Button>
                <p className="text-xs text-center text-[#8b95a1] mt-4">
                  약관동의 필요 &rarr; 아래 필요시 도움말 요청 가능합니다. 9%
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:hidden flex flex-col items-center gap-3 pb-10 px-6">
          <p className="text-sm font-medium text-[#333d4b]">근로자 교육 화면 QR</p>
          <QrCodeLink path={DEFAULT_WORKER_EDUCATION_PATH} size={156} />
        </div>
      </div>
    </div>
  )
}
