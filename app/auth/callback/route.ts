import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const next       = searchParams.get('next') ?? '/'

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  let authError: string | null = null

  if (code) {
    // PKCE flow — email confirmation, OAuth, magic link
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) authError = error.message
  } else if (tokenHash && type) {
    // OTP / email-change flow
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) authError = error.message
  } else {
    authError = 'missing_params'
  }

  if (!authError) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(
    `${origin}/auth?error=${encodeURIComponent(authError)}`
  )
}
