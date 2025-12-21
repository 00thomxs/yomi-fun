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
      .limit(30)

    const ouiOutcome = market.outcomes?.find((o: any) => o.name === 'OUI')
    const probability = ouiOutcome?.probability ?? 50
    const volume = market.volume ?? 0
    const isResolved = market.status === 'resolved'
    const winner = market.outcomes?.find((o: any) => o.is_winner === true)
    const question = market.question.length > 60 ? market.question.substring(0, 60) + '...' : market.question

    // Generate chart
    const chartPoints = generateChartPoints(history || [], probability)

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#09090b',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Very subtle grid background */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
              `,
              backgroundSize: '35px 35px',
            }}
          />

          {/* Red glow in top left corner */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              left: '-100px',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%)',
            }}
          />

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '40px 50px',
              height: '100%',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              {/* Logo - Y with checkmark */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="50" height="50" viewBox="0 0 100 100">
                  {/* Glow filter */}
                  <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="yGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444"/>
                      <stop offset="100%" stopColor="#b91c1c"/>
                    </linearGradient>
                  </defs>
                  {/* Y shape with integrated checkmark */}
                  <path
                    d="M20 15 L45 50 L45 85 L55 85 L55 50 L70 25 L85 10 L75 10 L62 30 L50 50 L38 30 L25 10 L15 10 Z"
                    fill="url(#yGrad)"
                    filter="url(#glow)"
                  />
                  {/* Checkmark on top right */}
                  <path
                    d="M60 8 L75 25 L95 5"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                  />
                </svg>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '36px', fontWeight: 900, color: '#dc2626', letterSpacing: '-1px' }}>
                    YOMI
                  </span>
                  <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.5)', marginLeft: '2px' }}>
                    .fun
                  </span>
                </div>
              </div>

              {/* Badge */}
              {isResolved && winner ? (
                <div
                  style={{
                    display: 'flex',
                    padding: '8px 18px',
                    backgroundColor: winner.name === 'OUI' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                    border: `1.5px solid ${winner.name === 'OUI' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(244, 63, 94, 0.5)'}`,
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ color: winner.name === 'OUI' ? '#22c55e' : '#f43f5e', fontSize: '16px', fontWeight: 700 }}>
                    ✓ {winner.name}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    padding: '6px 14px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {market.category || 'Prédiction'}
                  </span>
                </div>
              )}
            </div>

            {/* Question */}
            <div
              style={{
                fontSize: '42px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.2,
                marginBottom: '25px',
                letterSpacing: '-0.5px',
              }}
            >
              {question}
            </div>

            {/* Chart + Stats */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                gap: '30px',
              }}
            >
              {/* Chart - goes edge to edge */}
              <div style={{ display: 'flex', flex: 1, height: '180px' }}>
                <svg width="100%" height="100%" viewBox="0 0 850 180" preserveAspectRatio="none">
                  {/* Gradient */}
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* 50% line */}
                  <line x1="0" y1="90" x2="850" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4"/>
                  
                  {/* Area */}
                  <path d={`${chartPoints.path} L 850 180 L 0 180 Z`} fill="url(#areaGrad)"/>
                  
                  {/* Line */}
                  <path d={chartPoints.path} fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  
                  {/* End dot */}
                  <circle cx="840" cy={chartPoints.endY} r="10" fill="rgba(255,255,255,0.15)"/>
                  <circle cx="840" cy={chartPoints.endY} r="5" fill="#ffffff"/>
                </svg>
              </div>

              {/* Probability */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '150px' }}>
                <span style={{ fontSize: '72px', fontWeight: 900, color: '#ffffff', lineHeight: 1, letterSpacing: '-3px' }}>
                  {probability}%
                </span>
                <span style={{ fontSize: '20px', color: '#22c55e', fontWeight: 600, marginTop: '4px', letterSpacing: '1px' }}>
                  OUI
                </span>
              </div>
            </div>

            {/* Bottom */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '20px',
                paddingTop: '18px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 28px',
                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 700 }}>OUI {probability}%</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 28px',
                    backgroundColor: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ color: '#f43f5e', fontSize: '14px', fontWeight: 700 }}>NON {100 - probability}%</span>
                </div>
              </div>

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Vol</span>
                <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700 }}>
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
  const width = 850
  const height = 180
  const points: { x: number; y: number }[] = []
  
  if (history.length < 3) {
    // Smooth realistic trend
    const start = Math.max(15, currentProb - 20 + Math.random() * 10)
    const mid = start + (currentProb - start) * 0.6 + (Math.random() - 0.5) * 10
    const steps = 20
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      // Bezier-like interpolation
      const prob = start * Math.pow(1-t, 2) + mid * 2 * (1-t) * t + currentProb * Math.pow(t, 2)
      const noise = Math.sin(i * 0.8) * 5 * (1 - t)
      const y = height - (Math.max(5, Math.min(95, prob + noise)) / 100) * height
      points.push({ x: (i / steps) * width, y })
    }
  } else {
    history.forEach((point, i) => {
      const x = (i / (history.length - 1)) * width
      const y = height - (point.probability / 100) * height
      points.push({ x, y: Math.max(5, Math.min(height - 5, y)) })
    })
  }
  
  // Ensure last point is at current prob and at the right edge
  const endY = height - (currentProb / 100) * height
  points[points.length - 1] = { x: width, y: Math.max(5, Math.min(height - 5, endY)) }

  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`
  }

  return { path, endY: Math.max(5, Math.min(height - 5, endY)) }
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
          backgroundColor: '#09090b',
        }}
      >
        <svg width="80" height="80" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="yGradErr" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444"/>
              <stop offset="100%" stopColor="#b91c1c"/>
            </linearGradient>
          </defs>
          <path
            d="M20 15 L45 50 L45 85 L55 85 L55 50 L70 25 L85 10 L75 10 L62 30 L50 50 L38 30 L25 10 L15 10 Z"
            fill="url(#yGradErr)"
          />
          <path d="M60 8 L75 25 L95 5" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '20px' }}>
          <span style={{ fontSize: '48px', fontWeight: 900, color: '#dc2626' }}>YOMI</span>
          <span style={{ fontSize: '36px', color: 'rgba(255,255,255,0.5)' }}>.fun</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px', marginTop: '15px' }}>{message}</span>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
