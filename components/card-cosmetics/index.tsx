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
    return (
      <div 
        className={className}
        style={{
          background: `
            repeating-linear-gradient(
              45deg,
              ${effect.colors[0]} 0px,
              ${effect.colors[0]} 2px,
              ${effect.colors[1]} 2px,
              ${effect.colors[1]} 4px
            )
          `,
          opacity: 0.5,
        }}
      />
    )
  }
  
  if (effect.pattern === 'camo') {
    return (
      <>
        <div 
          className={className}
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, ${effect.colors[0]} 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, ${effect.colors[1]} 0%, transparent 40%),
              radial-gradient(ellipse at 60% 80%, ${effect.colors[2]} 0%, transparent 45%),
              radial-gradient(ellipse at 30% 70%, ${effect.colors[0]} 0%, transparent 35%),
              ${effect.colors[2]}
            `,
            opacity: 0.6,
          }}
        />
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
    // Generate random matrix characters
    const getMatrixChar = () => String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))
    const columns = 12
    const charsPerColumn = 8
    
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
          @keyframes glitchShift {
            0%, 100% { transform: translateX(0); filter: hue-rotate(0deg); }
            10% { transform: translateX(-2px); }
            20% { transform: translateX(2px); filter: hue-rotate(90deg); }
            30% { transform: translateX(0); }
            40% { transform: translateX(1px); filter: hue-rotate(180deg); }
            50% { transform: translateX(-1px); }
            60% { transform: translateX(0); filter: hue-rotate(270deg); }
          }
          @keyframes glitchLine {
            0%, 100% { opacity: 0; }
            50% { opacity: 0.3; }
          }
        `}</style>
        <div 
          className={className}
          style={{
            background: `
              linear-gradient(45deg, ${effect.colors[0]}20 0%, transparent 50%, ${effect.colors[1]}20 100%)
            `,
            animation: 'glitchShift 0.5s ease-in-out infinite',
          }}
        />
        {/* Glitch lines */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-px pointer-events-none"
            style={{
              top: `${10 + i * 20}%`,
              background: `linear-gradient(90deg, transparent, ${effect.colors[i % 3]}, transparent)`,
              animation: `glitchLine ${0.1 + i * 0.1}s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
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
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        `}</style>
        <div 
          className={className}
          style={{
            background: `linear-gradient(
              90deg,
              ${effect.colors[2]}20 0%,
              ${effect.colors[0]}40 25%,
              ${effect.colors[1]}60 50%,
              ${effect.colors[0]}40 75%,
              ${effect.colors[2]}20 100%
            )`,
            backgroundSize: '200% 100%',
            animation: 'goldShimmer 3s linear infinite',
          }}
        />
        {/* Gold particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full pointer-events-none"
            style={{
              left: `${10 + i * 11}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: effect.colors[0],
              boxShadow: `0 0 8px ${effect.colors[0]}, 0 0 16px ${effect.colors[0]}50`,
              animation: `goldShimmer ${2 + i * 0.3}s ease-in-out infinite`,
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
    case 'radar':
      return <RadarAura effect={effect} className={className} />
    case 'halo':
      return <HaloAura effect={effect} className={className} />
    case 'ghost':
      return <GlitchGhostAura effect={effect} className={className} />
    case 'flame':
      return <FlameAura effect={effect} className={className} />
    case 'crown':
      return <CrownAura effect={effect} className={className} />
    default:
      return null
  }
}

function RadarAura({ effect, className }: { effect: AuraEffect; className: string }) {
  return (
    <>
      <style>{`
        @keyframes radarScan {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
      <div 
        className={`absolute inset-0 ${className}`}
        style={{
          left: '50%',
          top: '50%',
          width: '150%',
          height: '150%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Radar sweep */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(from 0deg, transparent 0deg, ${effect.color}60 30deg, transparent 60deg)`,
            borderRadius: '50%',
            animation: `radarScan ${effect.speed || '3s'} linear infinite`,
          }}
        />
        {/* Radar rings */}
        {[1, 0.75, 0.5].map((scale, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              border: `1px solid ${effect.color}30`,
              borderRadius: '50%',
              transform: `scale(${scale})`,
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

function GlitchGhostAura({ effect, className }: { effect: AuraEffect; className: string }) {
  const colors = effect.colors || ['#ff0000', '#0000ff']
  return (
    <>
      <style>{`
        @keyframes ghostGlitch {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          20% { transform: translate(-4px, 2px); opacity: 0.6; }
          40% { transform: translate(4px, -1px); opacity: 0.2; }
          60% { transform: translate(-2px, -2px); opacity: 0.5; }
          80% { transform: translate(3px, 1px); opacity: 0.3; }
        }
      `}</style>
      {/* Red ghost - offset left */}
      <div 
        className={`absolute -inset-1 rounded-full ${className}`}
        style={{
          background: `radial-gradient(circle, ${colors[0]}50 0%, transparent 60%)`,
          animation: 'ghostGlitch 0.8s ease-in-out infinite',
          mixBlendMode: 'screen',
          transform: 'translate(-3px, 0)',
        }}
      />
      {/* Blue ghost - offset right */}
      <div 
        className={`absolute -inset-1 rounded-full ${className}`}
        style={{
          background: `radial-gradient(circle, ${colors[1]}50 0%, transparent 60%)`,
          animation: 'ghostGlitch 0.8s ease-in-out infinite reverse',
          animationDelay: '0.1s',
          mixBlendMode: 'screen',
          transform: 'translate(3px, 0)',
        }}
      />
    </>
  )
}

function FlameAura({ effect, className }: { effect: AuraEffect; className: string }) {
  const colors = effect.colors || ['#ff4500', '#ff8c00', '#ffd700']
  return (
    <>
      <style>{`
        @keyframes flameFlicker {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.7; }
          25% { transform: scaleY(1.05) scaleX(0.98); opacity: 0.9; }
          50% { transform: scaleY(0.97) scaleX(1.02); opacity: 0.6; }
          75% { transform: scaleY(1.03) scaleX(0.99); opacity: 0.8; }
        }
        @keyframes flameTip {
          0%, 100% { transform: scaleY(1) translateY(0); opacity: 0.8; }
          50% { transform: scaleY(1.2) translateY(-3px); opacity: 1; }
        }
      `}</style>
      <div className={`absolute -inset-2 overflow-hidden rounded-full ${className}`}>
        {/* Inner glow */}
        <div
          style={{
            position: 'absolute',
            inset: '-10%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse 80% 90% at 50% 80%, ${colors[0]}50 0%, ${colors[1]}30 50%, transparent 80%)`,
            animation: 'flameFlicker 0.4s ease-in-out infinite',
          }}
        />
        {/* Flame ring */}
        <div
          style={{
            position: 'absolute',
            inset: '-5%',
            borderRadius: '50%',
            border: `2px solid ${colors[1]}60`,
            boxShadow: `inset 0 0 15px ${colors[0]}40, 0 0 10px ${colors[1]}30`,
            animation: 'flameFlicker 0.5s ease-in-out infinite',
          }}
        />
        {/* Flame tips around the circle */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * 360
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '6px',
                height: '12px',
                background: `linear-gradient(to top, ${colors[0]}80, ${colors[2]}, transparent)`,
                borderRadius: '50% 50% 30% 30%',
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-45px)`,
                transformOrigin: 'center center',
                animation: `flameTip ${0.3 + (i % 3) * 0.1}s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          )
        })}
      </div>
    </>
  )
}

function CrownAura({ effect, className }: { effect: AuraEffect; className: string }) {
  return (
    <>
      <style>{`
        @keyframes crownFloat {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
        }
        @keyframes crownSparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
      <div 
        className={`absolute ${className}`}
        style={{ 
          top: '-35%', 
          left: '50%', 
          transform: 'translateX(-50%)',
          animation: 'crownFloat 2s ease-in-out infinite',
        }}
      >
        {/* Crown SVG */}
        <svg width="50" height="35" viewBox="0 0 50 35" fill="none">
          <path
            d="M5 30L10 10L17 20L25 5L33 20L40 10L45 30H5Z"
            fill={effect.color}
            stroke={effect.color}
            strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 8px ${effect.color})` }}
          />
          {/* Jewels */}
          <circle cx="25" cy="12" r="3" fill="#ff0000" />
          <circle cx="17" cy="18" r="2" fill="#00ff00" />
          <circle cx="33" cy="18" r="2" fill="#0000ff" />
        </svg>
        {/* Sparkles */}
        {effect.sparkle && [...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              top: `${10 + (i % 2) * 15}%`,
              left: `${20 + i * 20}%`,
              background: '#ffffff',
              boxShadow: '0 0 6px #ffffff',
              animation: `crownSparkle ${0.8 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
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

