import assert from 'node:assert/strict'
import test from 'node:test'

import { getClientAuthenticatedUser } from './client-session.ts'

test('uses the existing browser session before calling getUser', async () => {
  let getUserCalls = 0
  const sessionUser = { id: 'session-user' }

  const user = await getClientAuthenticatedUser({
    auth: {
      async getSession() {
        return { data: { session: { user: sessionUser } }, error: null }
      },
      async getUser() {
        getUserCalls += 1
        return { data: { user: null }, error: null }
      },
    },
  })

  assert.equal(user, sessionUser)
  assert.equal(getUserCalls, 0)
})

test('falls back to getUser when no browser session exists', async () => {
  const verifiedUser = { id: 'verified-user' }

  const user = await getClientAuthenticatedUser({
    auth: {
      async getSession() {
        return { data: { session: null }, error: null }
      },
      async getUser() {
        return { data: { user: verifiedUser }, error: null }
      },
    },
  })

  assert.equal(user, verifiedUser)
})

test('returns null only when neither session nor getUser has a user', async () => {
  const user = await getClientAuthenticatedUser({
    auth: {
      async getSession() {
        return { data: { session: null }, error: null }
      },
      async getUser() {
        return { data: { user: null }, error: new Error('not authenticated') }
      },
    },
  })

  assert.equal(user, null)
})
