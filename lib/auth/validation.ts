export type AuthMode = 'sign-in' | 'sign-up'

type AuthFormInput = {
  mode: AuthMode
  email: string
  password: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateAuthForm(input: AuthFormInput) {
  const email = input.email.trim()

  if (!email) {
    return '이메일을 입력해 주세요.'
  }

  if (!emailPattern.test(email)) {
    return '올바른 이메일을 입력해 주세요.'
  }

  if (input.password.length < 6) {
    return '비밀번호는 6자 이상이어야 합니다.'
  }

  return null
}
