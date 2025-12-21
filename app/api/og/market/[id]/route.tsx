import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Create Supabase client inside the function to ensure env vars are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase env vars')
      return generateFallbackImage('Configuration Error')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch market data (public read)
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

    if (error || !market) {
      console.error('Market fetch error:', error)
      return generateFallbackImage('Événement introuvable')
    }

    // Find OUI probability
    const ouiOutcome = market.outcomes?.find((o: any) => o.name === 'OUI')
    const probability = ouiOutcome?.probability ?? 50
    const volume = market.volume ?? 0
    const isResolved = market.status === 'resolved'
    const winner = market.outcomes?.find((o: any) => o.is_winner === true)

    // Truncate question if too long
    const question = market.question.length > 70 
      ? market.question.substring(0, 70) + '...' 
      : market.question

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0a0a',
            padding: '60px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header with Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '50px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '52px',
                  fontWeight: 900,
                  color: '#dc2626',
                }}
              >
                YOMI
              </span>
              <span
                style={{
                  fontSize: '40px',
                  fontWeight: 400,
                  color: '#ffffff',
                }}
              >
                .fun
              </span>
            </div>

            {isResolved && winner && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 24px',
                  backgroundColor: winner.name === 'OUI' ? '#22c55e' : '#ef4444',
                  borderRadius: '12px',
                }}
              >
                <span
                  style={{
                    color: '#000000',
                    fontSize: '28px',
                    fontWeight: 800,
                  }}
                >
                  {winner.name === 'OUI' ? '✓ OUI GAGNE' : '✗ NON GAGNE'}
                </span>
              </div>
            )}
          </div>

          {/* Question */}
          <div
            style={{
              fontSize: '52px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.3,
              marginBottom: '50px',
              display: 'flex',
            }}
          >
            {question}
          </div>

          {/* Spacer */}
          <div style={{ display: 'flex', flex: 1 }} />

          {/* Probability Bar */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '80px',
              borderRadius: '20px',
              overflow: 'hidden',
              marginBottom: '24px',
            }}
          >
            {/* OUI side */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${Math.max(probability, 15)}%`,
                backgroundColor: '#22c55e',
              }}
            >
              <span style={{ color: '#000000', fontSize: '32px', fontWeight: 800 }}>
                OUI {probability}%
              </span>
            </div>
            {/* NON side */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${Math.max(100 - probability, 15)}%`,
                backgroundColor: '#ef4444',
              }}
            >
              <span style={{ color: '#000000', fontSize: '32px', fontWeight: 800 }}>
                NON {100 - probability}%
              </span>
            </div>
          </div>

          {/* Volume */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#666666', fontSize: '28px' }}>
              Volume: 
            </span>
            <span style={{ color: '#ffffff', fontSize: '32px', fontWeight: 700, marginLeft: '12px' }}>
              {Number(volume).toLocaleString('fr-FR')} Zeny
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG Image generation error:', error)
    return generateFallbackImage('Erreur')
  }
}

// Fallback image for errors
function generateFallbackImage(message: string) {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '72px', fontWeight: 900, color: '#dc2626' }}>
            YOMI
          </span>
          <span style={{ fontSize: '56px', fontWeight: 400, color: '#ffffff' }}>
            .fun
          </span>
        </div>
        <span style={{ color: '#666666', fontSize: '32px' }}>
          {message}
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
