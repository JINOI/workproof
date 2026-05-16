type ClientAuthUser = {
  id: string
}

type ClientAuthAdapter<User extends ClientAuthUser> = {
  auth: {
    getSession: () => Promise<{
      data: {
        session: {
          user: User
        } | null
      }
      error?: unknown
    }>
    getUser: () => Promise<{
      data: {
        user: User | null
      }
      error?: unknown
    }>
  }
}

export async function getClientAuthenticatedUser<User extends ClientAuthUser>(supabase: ClientAuthAdapter<User>) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.user) {
    return session.user
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
