import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

// Load Geist fonts from Vercel CDN
const geistBlack = fetch(
  new URL('https://assets.vercel.com/raw/upload/v1734361780/geist/Geist-Black.ttf')
).then((res) => res.arrayBuffer())

const geistMono = fetch(
  new URL('https://assets.vercel.com/raw/upload/v1734361780/geist/GeistMono-Regular.ttf')
).then((res) => res.arrayBuffer())

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Load fonts
    const [geistBlackData, geistMonoData] = await Promise.all([geistBlack, geistMono])

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return generateFallbackImage('Config Error', geistBlackData, geistMonoData)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch market data with price history
    const { data: market, error } = await supabase
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

    if (error || !market) {
      return generateFallbackImage('Event not found', geistBlackData, geistMonoData)
    }

    // Get price history for chart
    const { data: history } = await supabase
      .from('market_price_history')
      .select('probability, recorded_at, outcome_index')
      .eq('market_id', id)
      .eq('outcome_index', 1) // OUI outcome
      .order('recorded_at', { ascending: true })
      .limit(50)

    // Find OUI probability
    const ouiOutcome = market.outcomes?.find((o: any) => o.name === 'OUI')
    const probability = ouiOutcome?.probability ?? 50
    const volume = market.volume ?? 0
    const isResolved = market.status === 'resolved'
    const winner = market.outcomes?.find((o: any) => o.is_winner === true)

    // Truncate question
    const question = market.question.length > 60 
      ? market.question.substring(0, 60) + '...' 
      : market.question

    // Generate chart path from history
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
            padding: '48px',
            fontFamily: 'GeistBlack',
            position: 'relative',
          }}
        >
          {/* Grid background pattern */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.15,
            }}
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Content container */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
            
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px',
              }}
            >
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span
                  style={{
                    fontSize: '44px',
                    fontWeight: 900,
                    color: '#dc2626',
                    fontFamily: 'GeistBlack',
                    letterSpacing: '-2px',
                  }}
                >
                  YOMI
                </span>
                <span
                  style={{
                    fontSize: '32px',
                    color: '#ffffff',
                    fontFamily: 'GeistMono',
                    opacity: 0.9,
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
                    padding: '10px 20px',
                    backgroundColor: winner.name === 'OUI' ? '#22c55e' : '#ef4444',
                    borderRadius: '10px',
                  }}
                >
                  <span
                    style={{
                      color: '#000000',
                      fontSize: '20px',
                      fontWeight: 800,
                      fontFamily: 'GeistBlack',
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
                fontSize: '42px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.2,
                marginBottom: '24px',
                fontFamily: 'GeistBlack',
                letterSpacing: '-1px',
              }}
            >
              {question}
            </div>

            {/* Chart area */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                minHeight: '180px',
                position: 'relative',
                marginBottom: '24px',
              }}
            >
              <svg
                style={{
                  width: '100%',
                  height: '100%',
                }}
                viewBox="0 0 1000 200"
                preserveAspectRatio="none"
              >
                {/* Reference line at 50% */}
                <line x1="0" y1="100" x2="1000" y2="100" stroke="#ffffff" strokeOpacity="0.1" strokeDasharray="8 8" />
                
                {/* Chart gradient */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area fill */}
                <path
                  d={chartPath.area}
                  fill="url(#chartGradient)"
                />
                
                {/* Line */}
                <path
                  d={chartPath.line}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Current price dot */}
                <circle
                  cx="980"
                  cy={200 - (probability * 2)}
                  r="8"
                  fill="#ffffff"
                />
              </svg>
              
              {/* Current probability label */}
              <div
                style={{
                  position: 'absolute',
                  right: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontSize: '56px',
                    fontWeight: 900,
                    color: '#ffffff',
                    fontFamily: 'GeistBlack',
                    letterSpacing: '-2px',
                  }}
                >
                  {probability}%
                </span>
                <span
                  style={{
                    fontSize: '20px',
                    color: '#22c55e',
                    fontFamily: 'GeistMono',
                    marginTop: '-8px',
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
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '20px',
              }}
            >
              {/* OUI/NON bar */}
              <div
                style={{
                  display: 'flex',
                  width: '600px',
                  height: '48px',
                  borderRadius: '12px',
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
                  <span style={{ color: '#000', fontSize: '18px', fontWeight: 800, fontFamily: 'GeistBlack' }}>
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
                  <span style={{ color: '#000', fontSize: '18px', fontWeight: 800, fontFamily: 'GeistBlack' }}>
                    NON {100 - probability}%
                  </span>
                </div>
              </div>

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#666', fontSize: '18px', fontFamily: 'GeistMono' }}>
                  Vol:
                </span>
                <span style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginLeft: '8px', fontFamily: 'GeistMono' }}>
                  {Number(volume).toLocaleString('fr-FR')} Z
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'GeistBlack',
            data: geistBlackData,
            style: 'normal',
            weight: 900,
          },
          {
            name: 'GeistMono',
            data: geistMonoData,
            style: 'normal',
            weight: 400,
          },
        ],
      }
    )
  } catch (error) {
    console.error('OG Image generation error:', error)
    // Return a simple fallback without custom fonts
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#09090b',
            fontSize: '48px',
            fontWeight: 900,
            color: '#dc2626',
          }}
        >
          YOMI.fun
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }
}

// Generate SVG path from price history
function generateChartPath(history: any[], currentProbability: number): { line: string; area: string } {
  const points: { x: number; y: number }[] = []
  
  if (history.length < 2) {
    // No history - generate a fake upward trend
    const startProb = Math.max(10, currentProbability - 15)
    for (let i = 0; i <= 10; i++) {
      const progress = i / 10
      const prob = startProb + (currentProbability - startProb) * progress
      // Add some random variation
      const variation = Math.sin(i * 0.8) * 5
      points.push({
        x: (i / 10) * 1000,
        y: 200 - ((prob + variation) * 2)
      })
    }
  } else {
    // Use real history
    history.forEach((point, i) => {
      const x = (i / (history.length - 1)) * 980
      const y = 200 - (point.probability * 2)
      points.push({ x, y })
    })
    // Add current probability as last point
    points.push({ x: 980, y: 200 - (currentProbability * 2) })
  }

  // Generate line path
  let linePath = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    linePath += ` L ${points[i].x} ${points[i].y}`
  }

  // Generate area path (closed)
  let areaPath = linePath
  areaPath += ` L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`

  return { line: linePath, area: areaPath }
}

// Fallback image with fonts
function generateFallbackImage(message: string, geistBlackData: ArrayBuffer, geistMonoData: ArrayBuffer) {
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
          fontFamily: 'GeistBlack',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '24px' }}>
          <span style={{ fontSize: '72px', fontWeight: 900, color: '#dc2626' }}>
            YOMI
          </span>
          <span style={{ fontSize: '56px', color: '#ffffff', fontFamily: 'GeistMono' }}>
            .fun
          </span>
        </div>
        <span style={{ color: '#666666', fontSize: '28px', fontFamily: 'GeistMono' }}>
          {message}
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'GeistBlack', data: geistBlackData, style: 'normal', weight: 900 },
        { name: 'GeistMono', data: geistMonoData, style: 'normal', weight: 400 },
      ],
    }
  )
}
