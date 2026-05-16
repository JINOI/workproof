const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ProfileUpdateInput = {
  displayName: string
  organizationName: string
  email: string
  password: string
}

export function validateProfileUpdate(input: ProfileUpdateInput) {
  const displayName = input.displayName.trim()
  const organizationName = input.organizationName.trim()
  const email = input.email.trim()
  const password = input.password

  if (!displayName) {
    return '이름을 입력해 주세요.'
  }

  if (!email) {
    return '이메일을 입력해 주세요.'
  }

  if (!emailPattern.test(email)) {
    return '올바른 이메일을 입력해 주세요.'
  }

  if (password && password.length < 6) {
    return '비밀번호는 6자 이상이어야 합니다.'
  }

  return null
}
