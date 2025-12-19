"use client"

import { type CSSProperties } from "react"

// ===========================================
// BACKGROUND EFFECTS
// ===========================================

export type BackgroundEffect = {
  type: 'pattern' | 'animated' | 'gradient'
  pattern?: string
  effect?: string
  colors: string[]
}

export function CardBackground({ effect, className = "" }: { effect: BackgroundEffect | null; className?: string }) {
  if (!effect) return null
  
  const baseClass = `absolute inset-0 z-0 pointer-events-none ${className}`
  
  switch (effect.type) {
    case 'pattern':
      return <PatternBackground effect={effect} className={baseClass} />
    case 'animated':
      return <AnimatedBackground effect={effect} className={baseClass} />
    case 'gradient':
      return <GradientBackground effect={effect} className={baseClass} />
    default:
      return null
  }
}

function PatternBackground({ effect, className }: { effect: BackgroundEffect; className: string }) {
  if (effect.pattern === 'carbon') {
    // Enhanced carbon fiber weave pattern
    return (
      <div 
        className={className}
        style={{
          background: `
            repeating-linear-gradient(
              45deg,
              ${effect.colors[0]} 0px,
              ${effect.colors[0]} 1px,
              transparent 1px,
              transparent 3px
            ),
            repeating-linear-gradient(
              -45deg,
              ${effect.colors[0]} 0px,
              ${effect.colors[0]} 1px,
              transparent 1px,
              transparent 3px
            ),
            repeating-linear-gradient(
              90deg,
              ${effect.colors[1]} 0px,
              ${effect.colors[1]} 2px,
              ${effect.colors[0]} 2px,
              ${effect.colors[0]} 4px
            )
          `,
          backgroundSize: '6px 6px, 6px 6px, 4px 4px',
          opacity: 0.7,
        }}
      />
    )
  }
  
  if (effect.pattern === 'camo') {
    // Military camo using SVG pattern - realistic organic shapes
    const camoSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect fill="${effect.colors[2]}" width="200" height="200"/>
        <path fill="${effect.colors[0]}" d="M20,30 Q50,10 80,35 T120,25 Q150,40 170,20 L180,60 Q160,80 130,70 T80,85 Q40,70 20,90 Z"/>
        <path fill="${effect.colors[1]}" d="M0,80 Q30,60 60,85 T100,70 Q130,90 160,75 L180,110 Q150,130 110,115 T50,130 Q20,110 0,130 Z"/>
        <path fill="${effect.colors[0]}" d="M10,140 Q40,120 75,145 T115,130 Q145,150 175,135 L190,175 Q160,195 120,180 T60,195 Q25,175 10,195 Z"/>
        <path fill="${effect.colors[1]}" d="M30,0 Q60,20 90,5 T140,15 Q170,0 200,20 L200,50 Q170,70 130,55 T70,65 Q35,50 0,70 L0,30 Z"/>
        <path fill="${effect.colors[0]}" d="M150,90 Q180,70 200,95 L200,140 Q175,160 145,145 T100,155 Q130,130 150,150 Z"/>
        <path fill="${effect.colors[1]}" d="M0,160 Q25,140 55,165 T95,150 L85,200 L0,200 Z"/>
        <path fill="${effect.colors[0]}" d="M120,170 Q150,155 180,175 L200,200 L100,200 Q115,185 120,170 Z"/>
      </svg>
    `
    const encodedSvg = `data:image/svg+xml,${encodeURIComponent(camoSvg)}`
    
    return (
      <div 
        className={className}
        style={{
          backgroundImage: `url("${encodedSvg}")`,
          backgroundSize: '150px 150px',
          backgroundRepeat: 'repeat',
          opacity: 0.9,
        }}
      />
    )
  }
  
  return null
}

function AnimatedBackground({ effect, className }: { effect: BackgroundEffect; className: string }) {
  if (effect.effect === 'electric') {
    return (
      <>
        <style>{`
          @keyframes electricPulse {
            0%, 100% { opacity: 0.3; filter: brightness(1); }
            50% { opacity: 0.6; filter: brightness(1.3); }
          }
          @keyframes electricBolt {
            0% { transform: translateY(-100%) scaleX(0.8); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translateY(100%) scaleX(1.2); opacity: 0; }
          }
        `}</style>
        <div 
          className={className}
          style={{
            background: `
              radial-gradient(ellipse at 50% 0%, ${effect.colors[0]}40 0%, transparent 60%),
              radial-gradient(ellipse at 0% 50%, ${effect.colors[1]}30 0%, transparent 50%),
              radial-gradient(ellipse at 100% 50%, ${effect.colors[0]}30 0%, transparent 50%),
              linear-gradient(to bottom, ${effect.colors[2]}, transparent)
            `,
            animation: 'electricPulse 2s ease-in-out infinite',
          }}
        />
        {/* Electric bolts */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-20 pointer-events-none"
            style={{
              left: `${20 + i * 30}%`,
              top: 0,
              background: `linear-gradient(to bottom, ${effect.colors[0]}, transparent)`,
              animation: `electricBolt ${1.5 + i * 0.5}s ease-in infinite`,
              animationDelay: `${i * 0.3}s`,
              boxShadow: `0 0 10px ${effect.colors[0]}, 0 0 20px ${effect.colors[0]}50`,
            }}
          />
        ))}
      </>
    )
  }
  
  if (effect.effect === 'matrix') {
    // Generate random binary/numbers for matrix effect
    const getMatrixChar = () => Math.random() > 0.5 ? '1' : '0'
    const columns = 15
    const charsPerColumn = 10
    
    return (
      <>
        <style>{`
          @keyframes matrixFall {
            0% { transform: translateY(-100%); opacity: 0; }
            5% { opacity: 0.8; }
            95% { opacity: 0.8; }
            100% { transform: translateY(400%); opacity: 0; }
          }
        `}</style>
        <div 
          className={className}
          style={{
            background: `radial-gradient(ellipse at 50% 50%, ${effect.colors[1]}80 0%, transparent 70%)`,
          }}
        />
        {/* Matrix rain columns */}
        {[...Array(columns)].map((_, col) => (
          <div
            key={col}
            className="absolute flex flex-col font-mono text-[8px] leading-tight pointer-events-none"
            style={{
              left: `${5 + col * 8}%`,
              top: '-40%',
              color: effect.colors[0],
              textShadow: `0 0 8px ${effect.colors[0]}, 0 0 15px ${effect.colors[0]}50`,
              animation: `matrixFall ${3 + col % 3}s linear infinite`,
              animationDelay: `${(col * 0.3) % 2}s`,
            }}
          >
            {[...Array(charsPerColumn)].map((_, char) => (
              <span key={char} style={{ opacity: 0.3 + (char / charsPerColumn) * 0.7 }}>
                {getMatrixChar()}
              </span>
            ))}
          </div>
        ))}
      </>
    )
  }
  
  // Holographic effect - replaces glitch
  if (effect.effect === 'glitch' || effect.effect === 'holographic') {
    return (
      <>
        <style>{`
          @keyframes holoShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
        {/* Holographic rainbow gradient */}
        <div 
          className={className}
          style={{
            background: `linear-gradient(
              135deg,
              #ff000030 0%,
              #ff800030 14%,
              #ffff0030 28%,
              #00ff0030 42%,
              #00ffff30 57%,
              #0000ff30 71%,
              #ff00ff30 85%,
              #ff000030 100%
            )`,
            backgroundSize: '400% 400%',
            animation: 'holoShift 4s ease-in-out infinite',
          }}
        />
        {/* Shimmer overlay */}
        <div 
          className={className}
          style={{
            background: `linear-gradient(
              45deg,
              transparent 30%,
              rgba(255,255,255,0.15) 50%,
              transparent 70%
            )`,
            backgroundSize: '200% 200%',
            animation: 'holoShift 3s ease-in-out infinite',
          }}
        />
      </>
    )
  }
  
  // Starfield effect
  if (effect.effect === 'starfield') {
    return (
      <>
        <style>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
        {/* Dark space background */}
        <div 
          className={className}
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #1a1a2e 0%, #0d0d1a 100%)',
          }}
        />
        {/* Stars */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              top: `${(i * 23 + 10) % 100}%`,
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              background: i % 5 === 0 ? '#ffffd0' : '#ffffff',
              boxShadow: i % 5 === 0 
                ? '0 0 4px #ffffd0, 0 0 8px #ffffd0' 
                : '0 0 2px #ffffff',
              animation: `twinkle ${1 + (i % 4) * 0.5}s ease-in-out infinite`,
              animationDelay: `${(i * 0.1) % 2}s`,
            }}
          />
        ))}
      </>
    )
  }
  
  // Neon Grid effect
  if (effect.effect === 'neongrid') {
    const color = effect.colors?.[0] || '#00ffff'
    return (
      <>
        <style>{`
          @keyframes gridPulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
        `}</style>
        {/* Dark background */}
        <div 
          className={className}
          style={{
            background: '#0a0a15',
            opacity: 0.9,
          }}
        />
        {/* Grid lines */}
        <div 
          className={className}
          style={{
            backgroundImage: `
              linear-gradient(${color}20 1px, transparent 1px),
              linear-gradient(90deg, ${color}20 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            animation: 'gridPulse 3s ease-in-out infinite',
          }}
        />
        {/* Glow at horizon */}
        <div 
          className={className}
          style={{
            background: `linear-gradient(to top, ${color}30 0%, transparent 40%)`,
          }}
        />
      </>
    )
  }
  
  return null
}

function GradientBackground({ effect, className }: { effect: BackgroundEffect; className: string }) {
  if (effect.effect === 'shimmer') {
    // Use darker gold tones for better readability
    const darkGold = '#8B7500'
    const medGold = '#B8960C'
    const lightGold = '#D4AF37'
    
    return (
      <>
        <style>{`
          @keyframes goldShimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes goldSparkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 0.8; transform: scale(1.1); }
          }
        `}</style>
        {/* Base dark gold gradient */}
        <div 
          className={className}
          style={{
            background: `linear-gradient(
              135deg,
              ${darkGold} 0%,
              ${medGold} 25%,
              ${lightGold} 50%,
              ${medGold} 75%,
              ${darkGold} 100%
            )`,
            opacity: 0.7,
          }}
        />
        {/* Shimmer overlay - subtle */}
        <div 
          className={className}
          style={{
            background: `linear-gradient(
              90deg,
              transparent 0%,
              rgba(255,215,0,0.1) 25%,
              rgba(255,255,255,0.2) 50%,
              rgba(255,215,0,0.1) 75%,
              transparent 100%
            )`,
            backgroundSize: '200% 100%',
            animation: 'goldShimmer 2.5s ease-in-out infinite',
          }}
        />
        {/* Gold sparkles - fewer and subtler */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${10 + (i * 15)}%`,
              top: `${15 + (i % 3) * 30}%`,
              width: '2px',
              height: '2px',
              background: lightGold,
              boxShadow: `0 0 4px ${lightGold}`,
              animation: `goldSparkle ${1 + (i % 3) * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </>
    )
  }
  
  return null
}

// ===========================================
// AVATAR AURA EFFECTS
// ===========================================

export type AuraEffect = {
  type: 'rotating' | 'floating' | 'glitch' | 'animated'
  effect: string
  color?: string
  colors?: string[]
  speed?: string
  glow?: boolean
  sparkle?: boolean
}

export function AvatarAura({ effect, className = "" }: { effect: AuraEffect | null; className?: string }) {
  if (!effect) return null
  
  switch (effect.effect) {
    // New reliable effects
    case 'sparkle':
      return <SparkleRingAura effect={effect} className={className} />
    case 'pulse':
      return <PulseRingAura effect={effect} className={className} />
    case 'diamond':
      return <DiamondAura effect={effect} className={className} />
    // Keep halo and crown
    case 'halo':
      return <HaloAura effect={effect} className={className} />
    case 'crown':
      return <CrownAura effect={effect} className={className} />
    // Legacy support for old effects (redirect to new ones)
    case 'radar':
      return <SparkleRingAura effect={effect} className={className} />
    case 'ghost':
      return <PulseRingAura effect={effect} className={className} />
    case 'flame':
      return <DiamondAura effect={effect} className={className} />
    default:
      return null
  }
}

// ============ NEW RELIABLE AURAS ============

function SparkleRingAura({ effect, className }: { effect: AuraEffect; className: string }) {
  const color = effect.color || '#ffffff'
  
  // Generate sparkle positions around a circle
  const sparkles = [...Array(8)].map((_, i) => {
    const angle = (i / 8) * Math.PI * 2
    const radius = 52 // Distance from center
    return {
      x: 50 + Math.cos(angle) * 45,
      y: 50 + Math.sin(angle) * 45,
      size: 4 + (i % 2) * 2,
      delay: i * 0.2,
    }
  })
  
  return (
    <>
      <style>{`
        @keyframes sparkleGlow {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
      {/* Glowing ring */}
      <div 
        className={`absolute ${className}`}
        style={{
          inset: '-6px',
          borderRadius: '50%',
          border: `2px solid ${color}60`,
          boxShadow: `0 0 10px ${color}40, inset 0 0 10px ${color}20`,
        }}
      />
      {/* Sparkles at fixed positions */}
      {sparkles.map((s, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            marginLeft: `-${s.size / 2}px`,
            marginTop: `-${s.size / 2}px`,
            background: color,
            borderRadius: '50%',
            boxShadow: `0 0 ${s.size * 2}px ${color}, 0 0 ${s.size * 3}px ${color}`,
            animation: `sparkleGlow ${0.8 + (i % 3) * 0.3}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </>
  )
}

function PulseRingAura({ effect, className }: { effect: AuraEffect; className: string }) {
  const color = effect.color || '#00ffff'
  return (
    <>
      <style>{`
        @keyframes pulseRing1 {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 0.4; }
        }
        @keyframes pulseRing2 {
          0%, 100% { transform: scale(1.05); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.2; }
        }
      `}</style>
      <div className={`absolute ${className}`} style={{ inset: '-8px' }}>
        {/* Inner ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            boxShadow: `0 0 10px ${color}, inset 0 0 10px ${color}30`,
            animation: `pulseRing1 ${effect.speed || '2s'} ease-in-out infinite`,
          }}
        />
        {/* Outer ring */}
        <div
          style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: `1px solid ${color}60`,
            boxShadow: `0 0 15px ${color}40`,
            animation: `pulseRing2 ${effect.speed || '2s'} ease-in-out infinite`,
            animationDelay: '0.3s',
          }}
        />
      </div>
    </>
  )
}

function DiamondAura({ effect, className }: { effect: AuraEffect; className: string }) {
  const color = effect.color || '#00ffff'
  return (
    <>
      <style>{`
        @keyframes diamondBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes diamondGlow {
          0%, 100% { filter: drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color}60); }
          50% { filter: drop-shadow(0 0 12px ${color}) drop-shadow(0 0 24px ${color}); }
        }
        @keyframes diamondSparkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
      {/* Container centered above avatar */}
      <div 
        className={`absolute ${className}`}
        style={{ 
          top: '-24px', 
          left: '50%', 
          marginLeft: '-10px', // Half of diamond width
          animation: 'diamondBob 2s ease-in-out infinite',
        }}
      >
        {/* Diamond shape using CSS */}
        <div
          style={{
            width: '20px',
            height: '20px',
            background: `linear-gradient(135deg, ${color} 0%, #ffffff 50%, ${color} 100%)`,
            transform: 'rotate(45deg)',
            animation: 'diamondGlow 1.5s ease-in-out infinite',
          }}
        />
      </div>
      {/* Sparkles around diamond */}
      {effect.sparkle && (
        <>
          <div className="absolute" style={{ top: '-30px', left: 'calc(50% - 18px)', width: '3px', height: '3px', background: '#fff', borderRadius: '50%', boxShadow: `0 0 4px ${color}`, animation: 'diamondSparkle 0.8s ease-in-out infinite' }} />
          <div className="absolute" style={{ top: '-30px', left: 'calc(50% + 15px)', width: '3px', height: '3px', background: '#fff', borderRadius: '50%', boxShadow: `0 0 4px ${color}`, animation: 'diamondSparkle 0.8s ease-in-out infinite', animationDelay: '0.3s' }} />
          <div className="absolute" style={{ top: '-18px', left: 'calc(50% - 22px)', width: '2px', height: '2px', background: '#fff', borderRadius: '50%', boxShadow: `0 0 3px ${color}`, animation: 'diamondSparkle 0.8s ease-in-out infinite', animationDelay: '0.5s' }} />
          <div className="absolute" style={{ top: '-18px', left: 'calc(50% + 20px)', width: '2px', height: '2px', background: '#fff', borderRadius: '50%', boxShadow: `0 0 3px ${color}`, animation: 'diamondSparkle 0.8s ease-in-out infinite', animationDelay: '0.7s' }} />
        </>
      )}
    </>
  )
}

function HaloAura({ effect, className }: { effect: AuraEffect; className: string }) {
  return (
    <>
      <style>{`
        @keyframes haloFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(-3px) scale(1.02); opacity: 1; }
        }
      `}</style>
      <div className={`absolute ${className}`} style={{ top: '-20%', left: '50%', transform: 'translateX(-50%)' }}>
        <div
          style={{
            width: '70px',
            height: '20px',
            borderRadius: '50%',
            border: `3px solid ${effect.color}`,
            boxShadow: effect.glow ? `0 0 15px ${effect.color}, 0 0 30px ${effect.color}50` : 'none',
            animation: 'haloFloat 2s ease-in-out infinite',
          }}
        />
      </div>
    </>
  )
}

// Crown Aura - Using emoji for universal beauty
function CrownAura({ effect, className }: { effect: AuraEffect; className: string }) {
  const color = effect.color || '#ffd700'
  return (
    <>
      <style>{`
        @keyframes crownBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes crownGlow {
          0%, 100% { text-shadow: 0 0 8px ${color}, 0 0 16px ${color}60; }
          50% { text-shadow: 0 0 12px ${color}, 0 0 24px ${color}; }
        }
      `}</style>
      {/* Crown emoji - centered above avatar */}
      <div 
        className={`absolute ${className}`}
        style={{ 
          top: '-28px', 
          left: '50%',
          marginLeft: '-16px',
          fontSize: '32px',
          lineHeight: 1,
          animation: 'crownBob 2s ease-in-out infinite, crownGlow 1.5s ease-in-out infinite',
        }}
      >
        👑
      </div>
    </>
  )
}

// Helper to parse preview_data from DB
export function parseBackgroundEffect(previewData: Record<string, any> | null): BackgroundEffect | null {
  if (!previewData || !previewData.type) return null
  return previewData as BackgroundEffect
}

export function parseAuraEffect(previewData: Record<string, any> | null): AuraEffect | null {
  if (!previewData || !previewData.type) return null
  return previewData as AuraEffect
}

