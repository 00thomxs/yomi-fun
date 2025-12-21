import { ImageResponse } from '@vercel/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Fetch market data
    const supabase = await createClient()
    const { data: market } = await supabase
      .from('markets')
      .select(`
        question,
        volume,
        status,
        image_url,
        outcomes:outcomes!market_id (name, probability, is_winner)
      `)
      .eq('id', id)
      .single()

    if (!market) {
      return new Response('Market not found', { status: 404 })
    }

    // Find OUI/NON probabilities
    const ouiOutcome = market.outcomes?.find((o: any) => o.name === 'OUI')
    const nonOutcome = market.outcomes?.find((o: any) => o.name === 'NON')
    const probability = ouiOutcome?.probability || 50
    const volume = market.volume || 0
    const isResolved = market.status === 'resolved'
    const winner = market.outcomes?.find((o: any) => o.is_winner === true)

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0a0a',
            padding: '50px',
            position: 'relative',
          }}
        >
          {/* Grid background */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '40px',
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span
                style={{
                  fontSize: '48px',
                  fontWeight: 900,
                  color: '#dc2626',
                  letterSpacing: '-2px',
                }}
              >
                YOMI
              </span>
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 400,
                  color: '#ffffff',
                }}
              >
                .fun
              </span>
            </div>

            {/* Status badge */}
            {isResolved && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 20px',
                  backgroundColor: winner?.name === 'OUI' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  border: `2px solid ${winner?.name === 'OUI' ? '#22c55e' : '#ef4444'}`,
                }}
              >
                <span
                  style={{
                    color: winner?.name === 'OUI' ? '#22c55e' : '#ef4444',
                    fontSize: '24px',
                    fontWeight: 700,
                  }}
                >
                  {winner?.name === 'OUI' ? '✓ OUI' : '✗ NON'}
                </span>
              </div>
            )}
          </div>

          {/* Question */}
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '40px',
              display: 'flex',
              maxWidth: '1000px',
            }}
          >
            {market.question.length > 80 
              ? market.question.substring(0, 80) + '...' 
              : market.question}
          </div>

          {/* Probability bar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginTop: 'auto',
            }}
          >
            {/* Progress bar container */}
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '60px',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: '#1a1a1a',
              }}
            >
              {/* OUI side */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: `${probability}%`,
                  backgroundColor: '#22c55e',
                  minWidth: probability > 10 ? 'auto' : '60px',
                }}
              >
                <span style={{ color: '#000', fontSize: '28px', fontWeight: 800 }}>
                  OUI {probability}%
                </span>
              </div>
              {/* NON side */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  backgroundColor: '#ef4444',
                }}
              >
                <span style={{ color: '#000', fontSize: '28px', fontWeight: 800 }}>
                  NON {100 - probability}%
                </span>
              </div>
            </div>

            {/* Volume */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ color: '#888', fontSize: '24px' }}>
                Volume:
              </span>
              <span style={{ color: '#fff', fontSize: '28px', fontWeight: 700 }}>
                {volume.toLocaleString('fr-FR')} Zeny
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
  } catch (error) {
    console.error('OG Image generation error:', error)
    return new Response('Error generating image', { status: 500 })
  }
}

