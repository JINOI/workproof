'use client'

import { CheckCircle2, FileText, QrCode } from 'lucide-react'

import { SafeBridgeLogo } from '@/components/brand/safebridge-logo'
import { cn } from '@/lib/utils'

const featureItems = [
  { icon: FileText, label: '안전 관리 가이드 등록' },
  { icon: QrCode, label: 'QR 교육 링크' },
  { icon: CheckCircle2, label: '이수 기록 저장' },
] as const

export function LandingHeroPanel() {
  return (
    <section className="flex min-h-screen w-full flex-1 flex-col items-center justify-center px-6 py-8 sm:px-8 lg:py-12">
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <div className="landing-hero-line flex w-full justify-center" style={{ animationDelay: '0s' }}>
          <SafeBridgeLogo variant="hero" priority className="block h-auto w-[220px] sm:w-[280px]" />
        </div>

        <p
          className="landing-hero-line mt-11 w-full text-sm font-medium text-[var(--brand-blue)]"
          style={{ animationDelay: '0.16s' }}
        >
          언어의 장벽을 넘어, 안전한 일터로
        </p>

        <h1 className="mt-4 w-full text-balance text-3xl font-bold leading-tight text-[#333d4b] lg:text-4xl">
          <span className="landing-hero-line block" style={{ animationDelay: '0.32s' }}>
            언어가 달라도,
          </span>
          <span className="landing-hero-line block" style={{ animationDelay: '0.4s' }}>
            <span className="text-[var(--brand-green)]">안전</span>은 제대로
          </span>
          <span className="landing-hero-line block" style={{ animationDelay: '0.48s' }}>
            <span className="text-[var(--brand-blue)]">이해</span>되어야 하니까.
          </span>
        </h1>
        <p
          className="landing-hero-line mt-5 w-full text-base leading-relaxed break-keep text-[#6b7684] lg:text-lg"
          style={{ animationDelay: '0.64s' }}
        >
          안전 관리 가이드 문서를 교육 카드와 퀴즈로 정리하고, 근로자는 QR 링크로 교육을 완료합니다. 관리자는 대시보드에서 이수
          상태를 확인할 수 있습니다.
        </p>

        <div className="mt-10 flex w-full flex-wrap items-center justify-center gap-6 lg:mt-12 lg:gap-8">
          {featureItems.map((item, index) => (
            <div
              key={item.label}
              className={cn('landing-hero-line flex flex-col items-center gap-2')}
              style={{ animationDelay: `${0.84 + index * 0.14}s` }}
            >
              <div className="landing-lift landing-lift--green flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm lg:h-12 lg:w-12">
                <item.icon className="h-5 w-5 text-[var(--brand-blue)]" />
              </div>
              <span className="text-xs text-[#6b7684]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
