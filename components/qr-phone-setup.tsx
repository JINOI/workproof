'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  QR_ORIGIN_STORAGE_KEY,
  isLoopbackHost,
  normalizeQrBase,
} from '@/lib/qr-origin'

function dispatchQrOriginChanged() {
  window.dispatchEvent(new Event('workproof-qr-origin'))
}

async function guessLanIPv4(): Promise<string | null> {
  const PC =
    typeof window !== 'undefined'
      ? (window.RTCPeerConnection ||
          (
            window as typeof window & {
              webkitRTCPeerConnection?: typeof RTCPeerConnection
            }
          ).webkitRTCPeerConnection)
      : undefined
  if (!PC) return null

  return new Promise((resolve) => {
    const pc = new PC({ iceServers: [] })
    let settled = false
    const done = (ip: string | null) => {
      if (settled) return
      settled = true
      try {
        pc.close()
      } catch {
        /* ignore */
      }
      resolve(ip)
    }

    const t = window.setTimeout(() => done(null), 2800)

    pc.onicecandidate = (ev) => {
      const cand = ev.candidate?.candidate
      if (!cand) return
      const m = /\b((?:[0-9]{1,3}\.){3}[0-9]{1,3})\b/.exec(cand)
      if (!m) return
      const ip = m[1]
      if (ip.startsWith('127.') || ip === '0.0.0.0') return
      window.clearTimeout(t)
      done(ip)
    }

    pc.createDataChannel('')
    pc.createOffer()
      .then((o) => pc.setLocalDescription(o))
      .catch(() => done(null))

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        window.clearTimeout(t)
        done(null)
      }
    }
  })
}

type QrPhoneSetupProps = {
  variant?: 'card' | 'plain'
  className?: string
}

export function QrPhoneSetup({ variant = 'card', className = '' }: QrPhoneSetupProps) {
  const [draft, setDraft] = useState('')
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    const port = typeof window !== 'undefined' ? window.location.port || '3000' : '3000'
    let cancelled = false
    void guessLanIPv4().then((ip) => {
      if (cancelled || !ip) return
      setHint(`감지된 PC IP: ${ip} · 아래에 http://${ip}:${port} 형식으로 적용해 보세요.`)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const apply = useCallback(() => {
    const raw = draft.trim()
    if (!raw) return
    let url: URL
    try {
      url = new URL(raw.includes('://') ? raw : `http://${raw}`)
    } catch {
      setHint('올바른 주소 형식이 아닙니다. 예: http://192.168.0.12:3000')
      return
    }
    if (isLoopbackHost(url.hostname)) {
      setHint('폰에서는 localhost 대신 PC의 IP 주소를 입력해야 합니다.')
      return
    }
    const base = normalizeQrBase(`${url.protocol}//${url.host}`)
    localStorage.setItem(QR_ORIGIN_STORAGE_KEY, base)
    dispatchQrOriginChanged()
    setHint('저장되었습니다. QR이 갱신됩니다. 같은 Wi‑Fi에서 폰으로 스캔해 보세요.')
  }, [draft])

  const wrap =
    variant === 'card'
      ? 'rounded-lg border border-[#e5e8eb] bg-white p-4 shadow-sm'
      : ''

  return (
    <div className={`${wrap} space-y-3 max-w-[280px] ${className}`}>
      <p className="text-xs text-[#333d4b] font-medium leading-snug">
        폰으로 QR을 열려면 <strong>localhost</strong>가 아니라{' '}
        <strong>이 PC의 LAN 주소</strong>가 필요합니다. (같은 Wi‑Fi)
      </p>
      {hint && <p className="text-[11px] text-[#6b7684] leading-relaxed">{hint}</p>}
      <div className="space-y-1.5">
        <Label htmlFor="qr-origin" className="text-xs text-[#333d4b]">
          QR·공유에 쓸 주소
        </Label>
        <Input
          id="qr-origin"
          placeholder="http://192.168.0.12:3000"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-9 text-sm border-[#e5e8eb]"
        />
      </div>
      <Button
        type="button"
        size="sm"
        className="w-full bg-[#3182f6] hover:bg-[#1b64da] text-white"
        onClick={apply}
      >
        적용 후 QR 갱신
      </Button>
      <p className="text-[10px] text-[#8b95a1] leading-relaxed">
        터미널에서 <code className="bg-[#f2f4f6] px-1 rounded">pnpm dev</code> 실행 후, PC
        브라우저도 가능하면 위와 같은 주소로 접속해 주세요.
      </p>
    </div>
  )
}
