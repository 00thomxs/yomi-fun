import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return new ImageResponse(
        (
          <div style={{ display: 'flex', fontSize: 40, color: 'white', background: 'red', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            Missing env vars
          </div>
        ),
        { width: 1200, height: 630 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch market data
    const { data: market, error } = await supabase
      .from('markets')
      .select(`
        question,
        volume,
        status,
        outcomes:outcomes!market_id (name, probability, is_winner)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return new ImageResponse(
        (
          <div style={{ display: 'flex', fontSize: 30, color: 'white', background: '#dc2626', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
            DB Error: {error.message}
          </div>
        ),
        { width: 1200, height: 630 }
      )
    }

    if (!market) {
      return new ImageResponse(
        (
          <div style={{ display: 'flex', fontSize: 40, color: 'white', background: '#dc2626', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            Market not found
          </div>
        ),
        { width: 1200, height: 630 }
      )
    }

    // Find OUI probability
    const ouiOutcome = market.outcomes?.find((o: any) => o.name === 'OUI')
    const probability = ouiOutcome?.probability ?? 50
    const volume = market.volume ?? 0
    const isResolved = market.status === 'resolved'
    const winner = market.outcomes?.find((o: any) => o.is_winner === true)

    // Simple question truncation
    const question = market.question.length > 60 
      ? market.question.substring(0, 60) + '...' 
      : market.question

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#09090b',
            padding: 50,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 30,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: '#dc2626' }}>YOMI</span>
              <span style={{ fontSize: 36, color: '#ffffff' }}>.fun</span>
            </div>

            {isResolved && winner && (
              <div
                style={{
                  display: 'flex',
                  padding: '12px 24px',
                  backgroundColor: winner.name === 'OUI' ? '#22c55e' : '#ef4444',
                  borderRadius: 12,
                }}
              >
                <span style={{ color: '#000', fontSize: 22, fontWeight: 800 }}>
                  {winner.name === 'OUI' ? '✓ OUI' : '✗ NON'}
                </span>
              </div>
            )}
          </div>

          {/* Question */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: 40,
            }}
          >
            {question}
          </div>

          {/* Spacer */}
          <div style={{ display: 'flex', flex: 1 }} />

          {/* Big probability */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 30,
            }}
          >
            <span style={{ fontSize: 120, fontWeight: 900, color: '#ffffff' }}>
              {probability}%
            </span>
            <span style={{ fontSize: 40, color: '#22c55e', marginLeft: 20 }}>
              OUI
            </span>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* OUI/NON bar */}
            <div
              style={{
                display: 'flex',
                width: 500,
                height: 50,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: `${Math.max(probability, 20)}%`,
                  backgroundColor: '#22c55e',
                }}
              >
                <span style={{ color: '#000', fontSize: 18, fontWeight: 800 }}>
                  OUI {probability}%
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  backgroundColor: '#ef4444',
                }}
              >
                <span style={{ color: '#000', fontSize: 18, fontWeight: 800 }}>
                  NON {100 - probability}%
                </span>
              </div>
            </div>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#666', fontSize: 20 }}>Volume: </span>
              <span style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginLeft: 8 }}>
                {Number(volume).toLocaleString('fr-FR')} Z
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error: any) {
    console.error('OG Image error:', error)
    return new ImageResponse(
      (
        <div style={{ display: 'flex', fontSize: 30, color: 'white', background: '#dc2626', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
          Error: {error?.message || 'Unknown error'}
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }
}
