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
    // True camouflage pattern with organic shapes
    return (
      <>
        <div 
          className={className}
          style={{
            background: effect.colors[2],
            opacity: 0.85,
          }}
        />
        {/* Camo blobs layer 1 */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`camo1-${i}`}
            className="absolute pointer-events-none"
            style={{
              left: `${(i * 25) % 100}%`,
              top: `${(i * 30 + 10) % 100}%`,
              width: `${40 + (i % 3) * 15}%`,
              height: `${30 + (i % 2) * 20}%`,
              background: effect.colors[0],
              borderRadius: '60% 40% 70% 30% / 40% 60% 30% 70%',
              transform: `rotate(${i * 45}deg)`,
              opacity: 0.9,
            }}
          />
        ))}
        {/* Camo blobs layer 2 */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`camo2-${i}`}
            className="absolute pointer-events-none"
            style={{
              left: `${(i * 35 + 15) % 100}%`,
              top: `${(i * 40 + 20) % 100}%`,
              width: `${35 + (i % 2) * 20}%`,
              height: `${25 + (i % 3) * 15}%`,
              background: effect.colors[1],
              borderRadius: '40% 60% 30% 70% / 60% 40% 70% 30%',
              transform: `rotate(${i * 60 + 30}deg)`,
              opacity: 0.85,
            }}
          />
        ))}
      </>
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
  
  if (effect.effect === 'glitch') {
    return (
      <>
        <style>{`
          @keyframes glitchShift1 {
            0%, 90%, 100% { transform: translateX(0); opacity: 0.7; }
            5% { transform: translateX(-8px) skewX(-2deg); opacity: 0.9; }
            10% { transform: translateX(6px) skewX(1deg); opacity: 0.6; }
            15% { transform: translateX(-4px); opacity: 0.8; }
          }
          @keyframes glitchShift2 {
            0%, 85%, 100% { transform: translateX(0); opacity: 0.7; }
            20% { transform: translateX(5px) skewX(1deg); opacity: 0.8; }
            25% { transform: translateX(-7px) skewX(-1deg); opacity: 0.6; }
            30% { transform: translateX(3px); opacity: 0.9; }
          }
          @keyframes glitchScan {
            0% { top: -10%; opacity: 0; }
            30% { opacity: 0.8; }
            70% { opacity: 0.8; }
            100% { top: 110%; opacity: 0; }
          }
        `}</style>
        {/* Base layer with chromatic aberration */}
        <div 
          className={className}
          style={{
            background: `linear-gradient(135deg, ${effect.colors[0]}50 0%, ${effect.colors[1]}30 50%, ${effect.colors[2]}50 100%)`,
            animation: 'glitchShift1 1.5s ease-in-out infinite',
          }}
        />
        {/* Offset color layers */}
        <div 
          className={className}
          style={{
            background: `linear-gradient(45deg, ${effect.colors[0]}40 0%, transparent 50%)`,
            animation: 'glitchShift2 1.2s ease-in-out infinite',
            mixBlendMode: 'screen',
          }}
        />
        <div 
          className={className}
          style={{
            background: `linear-gradient(-45deg, ${effect.colors[1]}40 0%, transparent 50%)`,
            animation: 'glitchShift1 0.8s ease-in-out infinite reverse',
            mixBlendMode: 'screen',
          }}
        />
        {/* Scan line */}
        <div
          className="absolute left-0 right-0 h-2 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent, ${effect.colors[2]}80, transparent)`,
            animation: 'glitchScan 2s linear infinite',
          }}
        />
        {/* Glitch bars */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: 0,
              right: 0,
              top: `${20 + i * 18}%`,
              height: `${3 + (i % 2) * 2}px`,
              background: effect.colors[i % 3],
              opacity: 0,
              animation: `glitchShift${(i % 2) + 1} ${0.3 + i * 0.1}s steps(2) infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </>
    )
  }
  
  return null
}

function GradientBackground({ effect, className }: { effect: BackgroundEffect; className: string }) {
  if (effect.effect === 'shimmer') {
    return (
      <>
        <style>{`
          @keyframes goldShimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes goldSparkle {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
        {/* Base gold gradient */}
        <div 
          className={className}
          style={{
            background: `linear-gradient(
              135deg,
              ${effect.colors[2]} 0%,
              ${effect.colors[0]} 30%,
              ${effect.colors[1]} 50%,
              ${effect.colors[0]} 70%,
              ${effect.colors[2]} 100%
            )`,
            opacity: 0.85,
          }}
        />
        {/* Shimmer overlay */}
        <div 
          className={className}
          style={{
            background: `linear-gradient(
              90deg,
              transparent 0%,
              rgba(255,255,255,0.1) 25%,
              rgba(255,255,255,0.4) 50%,
              rgba(255,255,255,0.1) 75%,
              transparent 100%
            )`,
            backgroundSize: '200% 100%',
            animation: 'goldShimmer 2s ease-in-out infinite',
          }}
        />
        {/* Gold sparkles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${5 + (i * 8)}%`,
              top: `${10 + (i % 4) * 22}%`,
              width: `${2 + (i % 2)}px`,
              height: `${2 + (i % 2)}px`,
              background: '#ffffff',
              boxShadow: `0 0 6px #ffffff, 0 0 12px ${effect.colors[0]}`,
              animation: `goldSparkle ${0.8 + (i % 3) * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
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
  return (
    <>
      <style>{`
        @keyframes sparkleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-3px) scale(1.3); opacity: 1; }
        }
        @keyframes sparkleRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div 
        className={`absolute ${className}`}
        style={{
          inset: '-12px',
          animation: 'sparkleRotate 8s linear infinite',
        }}
      >
        {/* Sparkle particles around the avatar */}
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * 360
          const delay = i * 0.15
          const size = 3 + (i % 3)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: `${size}px`,
                height: `${size}px`,
                background: color,
                borderRadius: '50%',
                boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}80`,
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-48px)`,
                animation: `sparkleFloat ${0.8 + (i % 4) * 0.3}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          )
        })}
      </div>
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
        @keyframes diamondFloat {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(45deg); }
          50% { transform: translateX(-50%) translateY(-5px) rotate(45deg); }
        }
        @keyframes diamondGlow {
          0%, 100% { box-shadow: 0 0 10px ${color}, 0 0 20px ${color}60; }
          50% { box-shadow: 0 0 20px ${color}, 0 0 40px ${color}; }
        }
        @keyframes diamondSparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div 
        className={`absolute ${className}`}
        style={{ 
          top: '-28px', 
          left: '50%', 
          transform: 'translateX(-50%)',
        }}
      >
        {/* Diamond shape */}
        <div
          style={{
            width: '18px',
            height: '18px',
            background: `linear-gradient(135deg, ${color}90 0%, ${color} 50%, ${color}70 100%)`,
            transform: 'rotate(45deg)',
            boxShadow: `0 0 15px ${color}, 0 0 30px ${color}60`,
            animation: 'diamondFloat 2.5s ease-in-out infinite, diamondGlow 2s ease-in-out infinite',
          }}
        />
        {/* Sparkles */}
        {effect.sparkle && [...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${-5 + (i % 2) * 25}px`,
              left: `${-8 + i * 10}px`,
              width: '4px',
              height: '4px',
              background: '#ffffff',
              borderRadius: '50%',
              boxShadow: `0 0 6px #ffffff`,
              animation: `diamondSparkle ${0.6 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
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

// Crown Aura - Lucide-inspired clean design
function CrownAura({ effect, className }: { effect: AuraEffect; className: string }) {
  const color = effect.color || '#ffd700'
  return (
    <>
      <style>{`
        @keyframes crownFloat {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-5px); }
        }
        @keyframes crownGlow {
          0%, 100% { filter: drop-shadow(0 0 4px ${color}) drop-shadow(0 0 8px ${color}80); }
          50% { filter: drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color}); }
        }
        @keyframes crownSparkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
      <div 
        className={`absolute ${className}`}
        style={{ 
          top: '-26px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          animation: 'crownFloat 2.5s ease-in-out infinite',
        }}
      >
        {/* Lucide-inspired Crown SVG - Clean minimal design */}
        <svg 
          width="48" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: 'crownGlow 2s ease-in-out infinite' }}
        >
          {/* Lucide Crown path */}
          <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
          <path d="M5 21h14" />
        </svg>
        {/* Sparkles */}
        {effect.sparkle && (
          <>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  top: `${-2 + (i % 2) * 8}px`,
                  left: `${4 + i * 10}px`,
                  width: '3px',
                  height: '3px',
                  background: '#ffffff',
                  boxShadow: `0 0 4px #ffffff, 0 0 8px ${color}`,
                  animation: `crownSparkle ${0.5 + i * 0.15}s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </>
        )}
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

