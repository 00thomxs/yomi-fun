import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Security check (optional but recommended for Vercel Cron)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow local testing or if CRON_SECRET is not set yet (dev mode)
      if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is missing')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find markets that should be closed
    const now = new Date().toISOString()
    
    // Update markets: set status to 'closed' and is_live to false
    const { data, error } = await supabase
      .from('markets')
      .update({ 
        status: 'closed',
        is_live: false 
      })
      .eq('status', 'open')
      .lt('closes_at', now)
      .select()

    if (error) {
      console.error('Error closing markets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      closed_markets_count: data.length,
      closed_markets: data.map(m => ({ id: m.id, question: m.question }))
    })

  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

