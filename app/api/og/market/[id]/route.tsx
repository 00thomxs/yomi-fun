import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return errorImage('Config Error')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: market, error } = await supabase
      .from('markets')
      .select(`
        question,
        volume,
        status,
        category,
        outcomes:outcomes!market_id (name, probability, is_winner)
      `)
      .eq('id', id)
      .single()

    if (error || !market) {
      return errorImage('Event not found')
    }

    // Get price history
    const { data: history } = await supabase
      .from('market_price_history')
      .select('probability')
      .eq('market_id', id)
      .eq('outcome_index', 1)
      .order('recorded_at', { ascending: true })
      .limit(25)

    const ouiOutcome = market.outcomes?.find((o: any) => o.name === 'OUI')
    const probability = ouiOutcome?.probability ?? 50
    const volume = market.volume ?? 0
    const isResolved = market.status === 'resolved'
    const winner = market.outcomes?.find((o: any) => o.is_winner === true)
    const question = market.question.length > 65 ? market.question.substring(0, 65) + '...' : market.question

    // Generate chart points
    const chartPoints = generateChartPoints(history || [], probability)

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0c0c0c',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            overflow: 'hidden',
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
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px',
            }}
          />

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '45px 50px',
              height: '100%',
              position: 'relative',
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '25px',
              }}
            >
              {/* Logo with glow */}
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span
                  style={{
                    fontSize: '42px',
                    fontWeight: 900,
                    color: '#dc2626',
                    letterSpacing: '-1px',
                    textShadow: '0 0 20px rgba(220, 38, 38, 0.6), 0 0 40px rgba(220, 38, 38, 0.3)',
                  }}
                >
                  YOMI
                </span>
                <span
                  style={{
                    fontSize: '28px',
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 400,
                    marginLeft: '2px',
                  }}
                >
                  .fun
                </span>
              </div>

              {/* Category or resolved badge */}
              {isResolved && winner ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 20px',
                    backgroundColor: winner.name === 'OUI' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    border: `2px solid ${winner.name === 'OUI' ? '#22c55e' : '#f43f5e'}`,
                    borderRadius: '10px',
                  }}
                >
                  <span
                    style={{
                      color: winner.name === 'OUI' ? '#22c55e' : '#f43f5e',
                      fontSize: '18px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Résultat: {winner.name}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {market.category || 'YOMI.fun'}
                  </span>
                </div>
              )}
            </div>

            {/* Question */}
            <div
              style={{
                fontSize: '38px',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.25,
                marginBottom: '30px',
              }}
            >
              {question}
            </div>

            {/* Chart area */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* Chart SVG */}
              <svg
                width="750"
                height="180"
                viewBox="0 0 750 180"
                style={{ overflow: 'visible' }}
              >
                {/* Reference line at 50% */}
                <line x1="0" y1="90" x2="750" y2="90" stroke="rgba(255,255,255,0.08)" strokeDasharray="5 5" />
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area fill */}
                <path
                  d={`${chartPoints.path} L 730 180 L 0 180 Z`}
                  fill="url(#chartGrad)"
                />
                
                {/* Line */}
                <path
                  d={chartPoints.path}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* End dot with glow */}
                <circle cx={chartPoints.endX} cy={chartPoints.endY} r="12" fill="rgba(255,255,255,0.2)" />
                <circle cx={chartPoints.endX} cy={chartPoints.endY} r="6" fill="#ffffff" />
              </svg>

              {/* Probability display */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  marginLeft: '40px',
                }}
              >
                <span
                  style={{
                    fontSize: '80px',
                    fontWeight: 900,
                    color: '#ffffff',
                    lineHeight: 1,
                    letterSpacing: '-4px',
                  }}
                >
                  {probability}%
                </span>
                <span
                  style={{
                    fontSize: '22px',
                    color: '#22c55e',
                    fontWeight: 600,
                    marginTop: '5px',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
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
                marginTop: '25px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* OUI/NON buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 35px',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    border: '1.5px solid rgba(34, 197, 94, 0.4)',
                    borderRadius: '10px',
                  }}
                >
                  <span style={{ color: '#22c55e', fontSize: '16px', fontWeight: 700 }}>
                    OUI {probability}%
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 35px',
                    backgroundColor: 'rgba(244, 63, 94, 0.12)',
                    border: '1.5px solid rgba(244, 63, 94, 0.4)',
                    borderRadius: '10px',
                  }}
                >
                  <span style={{ color: '#f43f5e', fontSize: '16px', fontWeight: 700 }}>
                    NON {100 - probability}%
                  </span>
                </div>
              </div>

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>Volume</span>
                <span style={{ color: '#ffffff', fontSize: '22px', fontWeight: 700 }}>
                  {Number(volume).toLocaleString('fr-FR')} Z
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  } catch (error: any) {
    return errorImage(error?.message || 'Error')
  }
}

function generateChartPoints(history: any[], currentProb: number) {
  const width = 730
  const height = 180
  const points: { x: number; y: number }[] = []
  
  if (history.length < 3) {
    // Generate realistic trend line
    const start = Math.max(10, currentProb - 25 + Math.random() * 15)
    const steps = 15
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps
      const base = start + (currentProb - start) * Math.pow(progress, 0.7)
      const noise = Math.sin(i * 1.2) * 8 * (1 - progress * 0.5) + (Math.random() - 0.5) * 4
      const prob = Math.max(5, Math.min(95, base + noise))
      const x = (i / steps) * width
      const y = height - (prob / 100) * height
      points.push({ x, y })
    }
  } else {
    history.forEach((point, i) => {
      const x = (i / (history.length - 1)) * width
      const y = height - (point.probability / 100) * height
      points.push({ x, y })
    })
  }
  
  // Ensure last point is current
  const endY = height - (currentProb / 100) * height
  if (points.length > 0) {
    points[points.length - 1] = { x: width, y: endY }
  }

  // Build smooth path
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`
  }

  return { path, endX: width, endY }
}

function errorImage(message: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0c0c0c',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '20px' }}>
          <span style={{ fontSize: '64px', fontWeight: 900, color: '#dc2626', textShadow: '0 0 30px rgba(220,38,38,0.5)' }}>YOMI</span>
          <span style={{ fontSize: '48px', color: 'rgba(255,255,255,0.7)' }}>.fun</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '20px' }}>{message}</span>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
