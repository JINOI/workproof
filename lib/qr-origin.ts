export const QR_ORIGIN_STORAGE_KEY = 'workproof_qr_origin'

export function normalizeQrBase(url: string): string {
  return url.trim().replace(/\/$/, '')
}

export function isLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]'
}
