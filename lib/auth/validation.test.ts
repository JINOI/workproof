import assert from 'node:assert/strict'
import test from 'node:test'

import { validateAuthForm } from './validation.ts'

test('rejects a missing email', () => {
  assert.equal(validateAuthForm({ mode: 'sign-in', email: '', password: 'password123' }), '이메일을 입력해 주세요.')
})

test('rejects an invalid email address', () => {
  assert.equal(validateAuthForm({ mode: 'sign-in', email: 'manager', password: 'password123' }), '올바른 이메일을 입력해 주세요.')
})

test('rejects a short password', () => {
  assert.equal(validateAuthForm({ mode: 'sign-up', email: 'manager@safebridge.kr', password: 'short' }), '비밀번호는 6자 이상이어야 합니다.')
})

test('accepts valid sign-up input', () => {
  assert.equal(validateAuthForm({ mode: 'sign-up', email: 'manager@safebridge.kr', password: 'password123' }), null)
})
