import Image from 'next/image'

import { cn } from '@/lib/utils'

const variants = {
  hero: { width: 280, height: 180, className: 'h-auto w-[220px] sm:w-[280px]' },
  sidebar: { width: 160, height: 103, className: 'h-10 w-auto' },
  compact: { width: 130, height: 84, className: 'h-9 w-auto' },
} as const

type SafeBridgeLogoProps = {
  variant?: keyof typeof variants
  className?: string
  priority?: boolean
}

export function SafeBridgeLogo({ variant = 'hero', className, priority }: SafeBridgeLogoProps) {
  const size = variants[variant]

  return (
    <Image
      src="/safebridge-logo.png"
      alt="SafeBridge"
      width={size.width}
      height={size.height}
      className={cn(size.className, className)}
      priority={priority ?? variant === 'hero'}
    />
  )
}
