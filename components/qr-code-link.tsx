'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'react-qr-code'
import { QrPhoneSetup } from '@/components/qr-phone-setup'
import {
  QR_ORIGIN_STORAGE_KEY,
  isLoopbackHost,
  normalizeQrBase,
} from '@/lib/qr-origin'

function syncQrBase(): {
  base: string | null
  needsPhoneSetup: boolean
} {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (env) {
    return { base: normalizeQrBase(env), needsPhoneSetup: false }
  }

  if (typeof window === 'undefined') {
    return { base: null, needsPhoneSetup: false }
  }

  const stored = localStorage.getItem(QR_ORIGIN_STORAGE_KEY)?.trim()
  if (stored) {
    return { base: normalizeQrBase(stored), needsPhoneSetup: false }
  }

  const host = window.location.hostname
  if (isLoopbackHost(host)) {
    return { base: null, needsPhoneSetup: true }
  }

  return { base: normalizeQrBase(window.location.origin), needsPhoneSetup: false }
}

export function useQrBaseUrl() {
  const [base, setBase] = useState<string | null>(null)
  const [needsPhoneSetup, setNeedsPhoneSetup] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    function apply() {
      const { base: b, needsPhoneSetup: needs } = syncQrBase()
      setBase(b)
      setNeedsPhoneSetup(needs)
      setReady(true)
    }
    apply()
    function onStorage() {
      apply()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('workproof-qr-origin', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('workproof-qr-origin', onStorage)
    }
  }, [])

  return { base, needsPhoneSetup, ready }
}

/** Demo SOP used on 랜딩·모달; 스캔 시 교육·퀴즈 체험 화면으로 연결 */
export const DEFAULT_WORKER_EDUCATION_PATH = '/education/sop-001'

type QrCodeLinkProps = {
  /** App path starting with / (e.g. /education/sop-001) */
  path: string
  size?: number
  className?: string
}

export function QrCodeLink({ path, size = 176, className }: QrCodeLinkProps) {
  const { base, needsPhoneSetup, ready } = useQrBaseUrl()
  const value = useMemo(() => {
    if (!base || !path) return ''
    const p = path.startsWith('/') ? path : `/${path}`
    return `${base}${p}`
  }, [base, path])

  if (!ready) {
    return (
      <div
        className={`rounded-lg bg-[#f2f4f6] animate-pulse ${className ?? ''}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  if (needsPhoneSetup && !base) {
    return (
      <div className={`space-y-3 ${className ?? ''}`}>
        <QrPhoneSetup variant="card" />
      </div>
    )
  }

  if (!value) {
    return (
      <div
        className={`rounded-lg bg-[#f2f4f6] animate-pulse ${className ?? ''}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  return (
    <div className={`rounded-lg bg-white p-3 shadow-sm inline-block ${className ?? ''}`}>
      <QRCode
        value={value}
        size={size}
        level="M"
        fgColor="#191f28"
        bgColor="#ffffff"
        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
      />
    </div>
  )
}

export function useQrDestinationUrl(path: string): string {
  const { base, ready } = useQrBaseUrl()
  return useMemo(() => {
    if (!ready || !base || !path) return ''
    const p = path.startsWith('/') ? path : `/${path}`
    return `${base}${p}`
  }, [ready, base, path])
}
