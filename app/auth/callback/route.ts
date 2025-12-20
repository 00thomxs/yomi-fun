import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user is banned
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_banned')
        .eq('id', data.user.id)
        .single()
      
      if (profile?.is_banned) {
        // Sign out the banned user
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=banned`)
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocal = process.env.NODE_ENV === 'development'
      
      if (isLocal) {
      return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://yomi-fun.vercel.app'}${next}`)
      }
    }
  }

  // Redirect to login page with error
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}

