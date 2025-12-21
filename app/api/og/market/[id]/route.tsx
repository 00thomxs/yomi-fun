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
      return generateFallbackImage('Config Error')
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

    if (error || !market) {
      return generateFallbackImage('Event not found')
    }

    // Get price history for chart
    const { data: history } = await supabase
      .from('market_price_history')
      .select('probability, recorded_at, outcome_index')
      .eq('market_id', id)
      .eq('outcome_index', 1)
      .order('recorded_at', { ascending: true })
      .limit(30)

    // Find OUI probability
    const ouiOutcome = market.outcomes?.find((o: any) => o.name === 'OUI')
    const probability = ouiOutcome?.probability ?? 50
    const volume = market.volume ?? 0
    const isResolved = market.status === 'resolved'
    const winner = market.outcomes?.find((o: any) => o.is_winner === true)

    // Truncate question
    const question = market.question.length > 55 
      ? market.question.substring(0, 55) + '...' 
      : market.question

    // Generate chart path
    const chartPath = generateChartPath(history || [], probability)

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#09090b',
            padding: '50px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '30px',
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
                  color: '#ffffff',
                  fontWeight: 400,
                }}
              >
                .fun
              </span>
            </div>

            {/* Status badge */}
            {isResolved && winner && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 24px',
                  backgroundColor: winner.name === 'OUI' ? '#22c55e' : '#ef4444',
                  borderRadius: '12px',
                }}
              >
                <span
                  style={{
                    color: '#000000',
                    fontSize: '22px',
                    fontWeight: 800,
                  }}
                >
                  {winner.name === 'OUI' ? '✓ OUI' : '✗ NON'}
                </span>
              </div>
            )}
          </div>

          {/* Question */}
          <div
            style={{
              fontSize: '44px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '20px',
              letterSpacing: '-1px',
            }}
          >
            {question}
          </div>

          {/* Chart + Probability */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              gap: '40px',
            }}
          >
            {/* Chart */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                height: '200px',
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 200"
                preserveAspectRatio="none"
              >
                {/* Reference line at 50% */}
                <line x1="0" y1="100" x2="800" y2="100" stroke="#ffffff" strokeOpacity="0.1" strokeDasharray="6 6" />
                
                {/* Gradient */}
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area */}
                <path d={chartPath.area} fill="url(#areaGradient)" />
                
                {/* Line */}
                <path d={chartPath.line} fill="none" stroke="#ffffff" strokeWidth="3" />
                
                {/* End dot */}
                <circle cx={chartPath.endX} cy={chartPath.endY} r="8" fill="#ffffff" />
              </svg>
            </div>

            {/* Probability */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <span
                style={{
                  fontSize: '72px',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-3px',
                  lineHeight: 1,
                }}
              >
                {probability}%
              </span>
              <span
                style={{
                  fontSize: '24px',
                  color: '#22c55e',
                  fontWeight: 600,
                  marginTop: '4px',
                }}
              >
                OUI
              </span>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* OUI/NON bar */}
            <div
              style={{
                display: 'flex',
                width: '550px',
                height: '50px',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: `${Math.max(probability, 18)}%`,
                  backgroundColor: '#22c55e',
                }}
              >
                <span style={{ color: '#000', fontSize: '18px', fontWeight: 800 }}>
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
                <span style={{ color: '#000', fontSize: '18px', fontWeight: 800 }}>
                  NON {100 - probability}%
                </span>
              </div>
            </div>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#666', fontSize: '18px' }}>Volume:</span>
              <span style={{ color: '#fff', fontSize: '24px', fontWeight: 700 }}>
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
  } catch (error) {
    console.error('OG Image error:', error)
    return generateFallbackImage('Error')
  }
}

// Generate chart path
function generateChartPath(history: any[], currentProb: number) {
  const width = 800
  const height = 200
  const points: { x: number; y: number }[] = []
  
  if (history.length < 2) {
    // Generate fake trend
    const startProb = Math.max(15, currentProb - 20 + Math.random() * 10)
    for (let i = 0; i <= 12; i++) {
      const progress = i / 12
      const prob = startProb + (currentProb - startProb) * Math.pow(progress, 0.8)
      const noise = Math.sin(i * 1.5) * 8 * (1 - progress)
      const y = height - ((prob + noise) / 100 * height)
      points.push({ x: (i / 12) * width, y: Math.max(10, Math.min(height - 10, y)) })
    }
  } else {
    history.forEach((point, i) => {
      const x = (i / (history.length - 1)) * (width - 20)
      const y = height - (point.probability / 100 * height)
      points.push({ x, y: Math.max(10, Math.min(height - 10, y)) })
    })
  }
  
  // Ensure last point is current probability
  const endY = height - (currentProb / 100 * height)
  points[points.length - 1] = { x: width - 20, y: Math.max(10, Math.min(height - 10, endY)) }

  // Build paths
  let line = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    line += ` L ${points[i].x} ${points[i].y}`
  }

  const lastPoint = points[points.length - 1]
  const area = `${line} L ${lastPoint.x} ${height} L ${points[0].x} ${height} Z`

  return { line, area, endX: lastPoint.x, endY: lastPoint.y }
}

// Fallback image
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
          backgroundColor: '#09090b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '20px' }}>
          <span style={{ fontSize: '72px', fontWeight: 900, color: '#dc2626' }}>YOMI</span>
          <span style={{ fontSize: '54px', color: '#ffffff' }}>.fun</span>
        </div>
        <span style={{ color: '#666', fontSize: '24px' }}>{message}</span>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
