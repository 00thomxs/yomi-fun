import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const LOGO_URL = 'https://y0mi.fun/images/LOGOYOMI.png'

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
    const question = market.question.length > 55 ? market.question.substring(0, 55) + '...' : market.question

    // Generate smooth chart
    const chartPath = generateChart(history || [], probability)

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0a0a',
            position: 'relative',
          }}
        >
          {/* Subtle grid */}
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
              {/* Logo */}
              <img 
                src={LOGO_URL}
                width="280"
                height="110"
                style={{ objectFit: 'contain' }}
              />

              {/* Resolved badge */}
              {isResolved && winner && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 24px',
                    backgroundColor: winner.name === 'OUI' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    border: `2px solid ${winner.name === 'OUI' ? '#22c55e' : '#f43f5e'}`,
                    borderRadius: '12px',
                  }}
                >
                  <span
                    style={{
                      color: winner.name === 'OUI' ? '#22c55e' : '#f43f5e',
                      fontSize: '20px',
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
                fontSize: '46px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.2,
                marginBottom: '25px',
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
                gap: '35px',
              }}
            >
              {/* Chart */}
              <div style={{ display: 'flex', flex: 1, height: '200px' }}>
                <svg width="100%" height="100%" viewBox="0 0 850 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* 50% line */}
                  <line x1="0" y1="100" x2="850" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="5 5"/>
                  
                  {/* Area */}
                  <path d={`${chartPath.path} L 850 200 L 0 200 Z`} fill="url(#areaGrad)"/>
                  
                  {/* Line */}
                  <path d={chartPath.path} fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  
                  {/* End dot */}
                  <circle cx="845" cy={chartPath.endY} r="12" fill="rgba(255,255,255,0.15)"/>
                  <circle cx="845" cy={chartPath.endY} r="6" fill="#ffffff"/>
                </svg>
              </div>

              {/* Probability */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '85px', fontWeight: 900, color: '#ffffff', lineHeight: 1, letterSpacing: '-4px' }}>
                  {probability}%
                </span>
                <span style={{ fontSize: '24px', color: '#22c55e', fontWeight: 700, marginTop: '8px' }}>
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
                paddingTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 35px',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '2px solid rgba(34, 197, 94, 0.4)',
                    borderRadius: '12px',
                  }}
                >
                  <span style={{ color: '#22c55e', fontSize: '18px', fontWeight: 700 }}>OUI {probability}%</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 35px',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    border: '2px solid rgba(244, 63, 94, 0.4)',
                    borderRadius: '12px',
                  }}
                >
                  <span style={{ color: '#f43f5e', fontSize: '18px', fontWeight: 700 }}>NON {100 - probability}%</span>
                </div>
              </div>

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px' }}>Volume</span>
                <span style={{ color: '#ffffff', fontSize: '26px', fontWeight: 700 }}>
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

function generateChart(history: any[], currentProb: number) {
  const width = 850
  const height = 200
  const points: { x: number; y: number }[] = []
  
  if (history.length < 3) {
    // Smooth trend
    const start = Math.max(10, currentProb - 20 + Math.random() * 10)
    const steps = 18
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const base = start + (currentProb - start) * Math.pow(t, 0.6)
      const noise = Math.sin(i * 1.1) * 7 * (1 - t * 0.5)
      const prob = Math.max(5, Math.min(95, base + noise))
      const y = height - (prob / 100) * height
      points.push({ x: (i / steps) * width, y })
    }
  } else {
    history.forEach((point, i) => {
      const x = (i / (history.length - 1)) * width
      const y = height - (point.probability / 100) * height
      points.push({ x, y: Math.max(10, Math.min(height - 10, y)) })
    })
  }
  
  const endY = height - (currentProb / 100) * height
  points[points.length - 1] = { x: width, y: Math.max(10, Math.min(height - 10, endY)) }

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
          backgroundColor: '#0a0a0a',
        }}
      >
        <img src={LOGO_URL} width="250" height="90" style={{ objectFit: 'contain' }} />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '22px', marginTop: '30px' }}>{message}</span>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
