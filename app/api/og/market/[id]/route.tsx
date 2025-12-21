import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

// Logo URL - will be loaded from public folder
const LOGO_URL = 'https://y0mi.fun/images/yomi-logo.png'

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
      .limit(40)

    const ouiOutcome = market.outcomes?.find((o: any) => o.name === 'OUI')
    const probability = ouiOutcome?.probability ?? 50
    const volume = market.volume ?? 0
    const isResolved = market.status === 'resolved'
    const winner = market.outcomes?.find((o: any) => o.is_winner === true)
    const question = market.question.length > 55 ? market.question.substring(0, 55) + '...' : market.question

    // Generate volatile chart
    const chartPath = generateVolatileChart(history || [], probability)

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
          {/* Very subtle grid */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Red ambient glow */}
          <div
            style={{
              position: 'absolute',
              top: '-150px',
              left: '-100px',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(220, 38, 38, 0.12) 0%, transparent 60%)',
            }}
          />

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '40px 55px',
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
                marginBottom: '25px',
              }}
            >
              {/* Logo image only */}
              <img 
                src={LOGO_URL}
                width="140"
                height="50"
                style={{ objectFit: 'contain' }}
              />

              {/* Resolved badge - clean style */}
              {isResolved && winner && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 22px',
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
                    }}
                  >
                    Résultat : {winner.name}
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
                letterSpacing: '-0.5px',
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
              <div style={{ display: 'flex', flex: 1, height: '200px' }}>
                <svg width="100%" height="100%" viewBox="0 0 900 200" preserveAspectRatio="none">
                  {/* Gradient fill */}
                  <defs>
                    <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* 50% reference line */}
                  <line x1="0" y1="100" x2="900" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="6 6"/>
                  
                  {/* Area */}
                  <path d={`${chartPath.path} L 900 200 L 0 200 Z`} fill="url(#fillGrad)"/>
                  
                  {/* Line - THICK */}
                  <path d={chartPath.path} fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  
                  {/* End glow + dot */}
                  <circle cx="890" cy={chartPath.endY} r="14" fill="rgba(255,255,255,0.12)"/>
                  <circle cx="890" cy={chartPath.endY} r="7" fill="#ffffff"/>
                </svg>
              </div>

              {/* Big probability */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '140px' }}>
                <span style={{ fontSize: '80px', fontWeight: 900, color: '#ffffff', lineHeight: 1, letterSpacing: '-4px' }}>
                  {probability}%
                </span>
                <span style={{ fontSize: '22px', color: '#22c55e', fontWeight: 700, marginTop: '5px', letterSpacing: '2px' }}>
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
                marginTop: '15px',
                paddingTop: '18px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* OUI / NON buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 32px',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1.5px solid rgba(34, 197, 94, 0.4)',
                    borderRadius: '10px',
                  }}
                >
                  <span style={{ color: '#22c55e', fontSize: '16px', fontWeight: 700 }}>OUI {probability}%</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 32px',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    border: '1.5px solid rgba(244, 63, 94, 0.4)',
                    borderRadius: '10px',
                  }}
                >
                  <span style={{ color: '#f43f5e', fontSize: '16px', fontWeight: 700 }}>NON {100 - probability}%</span>
                </div>
              </div>

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '16px' }}>Volume</span>
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

// Generate a more volatile chart
function generateVolatileChart(history: any[], currentProb: number) {
  const width = 900
  const height = 200
  const points: { x: number; y: number }[] = []
  
  if (history.length < 5) {
    // Generate volatile fake data
    let prob = Math.max(20, currentProb - 30 + Math.random() * 20)
    const steps = 25
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      // Add volatility
      const volatility = 12 * (1 - t * 0.3) // More volatile at start
      const noise = (Math.random() - 0.5) * volatility + Math.sin(i * 0.7) * 6
      // Trend towards current
      const trend = (currentProb - prob) * 0.15
      prob = Math.max(5, Math.min(95, prob + trend + noise))
      
      const x = (i / steps) * width
      const y = height - (prob / 100) * height
      points.push({ x, y: Math.max(10, Math.min(height - 10, y)) })
    }
    // Ensure last point is current prob
    points[points.length - 1] = { x: width, y: height - (currentProb / 100) * height }
  } else {
    // Use real data
    history.forEach((point, i) => {
      const x = (i / (history.length - 1)) * width
      const y = height - (point.probability / 100) * height
      points.push({ x, y: Math.max(10, Math.min(height - 10, y)) })
    })
    // Ensure ends at current prob
    const endY = height - (currentProb / 100) * height
    points[points.length - 1] = { x: width, y: Math.max(10, Math.min(height - 10, endY)) }
  }

  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`
  }

  return { path, endY: points[points.length - 1].y }
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
        <img src={LOGO_URL} width="200" height="70" style={{ objectFit: 'contain' }} />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '20px', marginTop: '25px' }}>{message}</span>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
