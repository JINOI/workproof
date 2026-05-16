import { NextResponse } from 'next/server'

import { validateProfileUpdate } from '@/lib/auth/profile-validation'
import { createClient } from '@/lib/supabase/server'

function getAuthErrorMessage(message: string) {
  if (message.toLowerCase().includes('same password')) {
    return '이전 비밀번호와 다른 비밀번호를 입력해 주세요.'
  }

  if (message.toLowerCase().includes('invalid email')) {
    return '올바른 이메일을 입력해 주세요.'
  }

  return message
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, organization_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw profileError
    }

    return NextResponse.json({
      profile: {
        displayName: profile.display_name ?? '',
        organizationName: profile.organization_name ?? '',
        email: user.email ?? '',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '프로필을 불러오지 못했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = (await request.json()) as {
      displayName?: string
      organizationName?: string
      email?: string
      password?: string
    }

    const validationError = validateProfileUpdate({
      displayName: body.displayName ?? '',
      organizationName: body.organizationName ?? '',
      email: body.email ?? '',
      password: body.password ?? '',
    })

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const displayName = body.displayName!.trim()
    const organizationName = body.organizationName!.trim()
    const email = body.email!.trim()
    const password = body.password?.trim() ?? ''

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        organization_name: organizationName || null,
      })
      .eq('id', user.id)

    if (profileError) {
      throw profileError
    }

    const authUpdates: { email?: string; password?: string; data?: Record<string, string | null> } = {
      data: {
        display_name: displayName,
        organization_name: organizationName || null,
      },
    }

    if (email !== user.email) {
      authUpdates.email = email
    }

    if (password) {
      authUpdates.password = password
    }

    const { error: authError } = await supabase.auth.updateUser(authUpdates)

    if (authError) {
      return NextResponse.json({ error: getAuthErrorMessage(authError.message) }, { status: 400 })
    }

    const {
      data: { user: updatedUser },
    } = await supabase.auth.getUser()

    return NextResponse.json({
      profile: {
        displayName,
        organizationName,
        email: updatedUser?.email ?? email,
      },
      message: authUpdates.email ? '프로필을 저장했습니다. 이메일 변경 확인 메일이 발송될 수 있습니다.' : '프로필을 저장했습니다.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '프로필을 저장하지 못했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
