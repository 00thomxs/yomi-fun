"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { cn } from "@/lib/utils"

type Stage = "idle" | "charging" | "impact" | "shatter" | "reveal" | "revealed"

export function YomiCardPack({
  children,
  onReveal,
}: {
  children: React.ReactNode
  onReveal?: () => void
}) {
  const [stage, setStage] = useState<Stage>("idle")
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)

  // Glass shards - more realistic with varied shapes and sizes
  const shards = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => {
      const ring = Math.floor(i / 10) // 0-3, inner to outer rings
      const angleBase = (i % 10) * 36 + Math.random() * 20
      const distance = 200 + ring * 80 + Math.random() * 60
      
      return {
        id: i,
        // Start position (clustered in center area)
        startX: 50 + (Math.random() - 0.5) * 60,
        startY: 50 + (Math.random() - 0.5) * 80,
        // End position (flying outward)
        endX: Math.cos((angleBase * Math.PI) / 180) * distance,
        endY: Math.sin((angleBase * Math.PI) / 180) * distance,
        // Shard properties
        width: 8 + Math.random() * 20,
        height: 12 + Math.random() * 30,
        rotation: Math.random() * 360,
        rotationEnd: (Math.random() - 0.5) * 1080,
        delay: ring * 0.02 + Math.random() * 0.05,
        duration: 0.6 + Math.random() * 0.3,
        // Visual properties
        opacity: 0.6 + Math.random() * 0.4,
        hasGlow: i % 3 === 0,
        glowColor: i % 2 === 0 ? '#ef4444' : '#ffffff',
      }
    })
  }, [])

  // Energy particles for charging
  const energyParticles = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => {
      const angle = (i / 60) * 360
      const orbitRadius = 120 + (i % 3) * 40
      return {
        id: i,
        angle,
        orbitRadius,
        size: 2 + Math.random() * 4,
        speed: 0.8 + Math.random() * 0.4,
        delay: i * 0.02,
      }
    })
  }, [])

  // Debris/dust particles
  const debris = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => {
      const angle = Math.random() * 360
      const distance = 150 + Math.random() * 200
      return {
        id: i,
        endX: Math.cos((angle * Math.PI) / 180) * distance,
        endY: Math.sin((angle * Math.PI) / 180) * distance,
        size: 1 + Math.random() * 3,
        delay: Math.random() * 0.15,
        duration: 0.4 + Math.random() * 0.4,
        isRed: Math.random() > 0.5,
      }
    })
  }, [])

  // Lightning cracks
  const cracks = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => {
      const angle = (i / 16) * 360
      const segments: { x: number; y: number }[] = []
      let x = 0, y = 0
      const length = 40 + Math.random() * 30
      const steps = 4 + Math.floor(Math.random() * 3)
      
      for (let s = 0; s < steps; s++) {
        const stepLen = length / steps
        const deviation = (Math.random() - 0.5) * 15
        x += Math.cos(((angle + deviation) * Math.PI) / 180) * stepLen
        y += Math.sin(((angle + deviation) * Math.PI) / 180) * stepLen
        segments.push({ x, y })
      }
      
      return { id: i, angle, segments, delay: i * 0.03 }
    })
  }, [])

  // Hold to charge mechanic
  useEffect(() => {
    if (!isHolding || stage !== "idle") return
    
    const interval = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          triggerOpen()
          return 100
        }
        return prev + 4 // ~0.6s to charge
      })
    }, 25)
    
    return () => clearInterval(interval)
  }, [isHolding, stage])

  const triggerOpen = () => {
    setStage("charging")
    
    setTimeout(() => setStage("impact"), 400)
    setTimeout(() => setStage("shatter"), 600)
    setTimeout(() => setStage("reveal"), 1200)
    setTimeout(() => {
      setStage("revealed")
      onReveal?.()
    }, 1800)
  }

  const handlePointerDown = () => {
    if (stage === "idle") {
      setIsHolding(true)
      setHoldProgress(0)
    }
  }

  const handlePointerUp = () => {
    setIsHolding(false)
    if (holdProgress < 100 && stage === "idle") {
      setHoldProgress(0)
    }
  }

  const handleClick = () => {
    if (stage === "idle" && holdProgress === 0) {
      triggerOpen()
    }
  }

  if (stage === "revealed") {
    return (
      <div className="relative">
        <div 
          className="animate-in zoom-in-95 fade-in duration-500"
          style={{ animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick} 
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={cn(
        "relative w-[320px] aspect-[2/3] cursor-pointer select-none touch-none",
        stage === "idle" && "hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
      )}
    >
      {/* Outer energy field */}
      <div
        className={cn(
          "absolute -inset-16 rounded-full pointer-events-none transition-all",
          stage === "idle" && "opacity-20",
          stage === "charging" && "opacity-100 scale-110",
          stage === "impact" && "opacity-100 scale-150",
          stage === "shatter" && "opacity-0 scale-200",
        )}
        style={{
          background: `radial-gradient(ellipse, rgba(239, 68, 68, ${stage === "impact" ? 0.8 : 0.4}) 0%, transparent 60%)`,
          filter: 'blur(30px)',
          transitionDuration: stage === "impact" ? '0.1s' : '0.4s',
        }}
      />

      {/* Orbiting energy particles during charge */}
      {(stage === "idle" && holdProgress > 0) || stage === "charging" ? (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {energyParticles.map((p) => (
            <div
              key={p.id}
              className="absolute left-1/2 top-1/2"
              style={{
                width: p.size,
                height: p.size,
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
                background: p.id % 2 === 0 ? '#ef4444' : '#fff',
                borderRadius: '50%',
                boxShadow: `0 0 ${p.size * 2}px ${p.id % 2 === 0 ? '#ef4444' : '#fff'}`,
                animation: stage === "charging" 
                  ? `orbitConverge 0.4s ease-in forwards`
                  : `orbit ${2 / p.speed}s linear infinite`,
                animationDelay: `${p.delay}s`,
                transform: `rotate(${p.angle}deg) translateX(${p.orbitRadius * (stage === "charging" ? 0.5 : 1)}px)`,
                opacity: holdProgress / 100,
              }}
            />
          ))}
        </div>
      ) : null}

      {/* Lightning cracks on impact */}
      {(stage === "impact" || stage === "shatter") && (
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
          viewBox="-50 -75 200 300"
          style={{ transform: 'translate(-25%, -25%) scale(1.5)' }}
        >
          <defs>
            <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {cracks.map((crack) => {
            const pathD = `M 50 75 ${crack.segments.map(s => `L ${50 + s.x} ${75 + s.y}`).join(' ')}`
            return (
              <g key={crack.id}>
                {/* Glow layer */}
                <path
                  d={pathD}
                  stroke="#ef4444"
                  strokeWidth="6"
                  fill="none"
                  filter="url(#glowFilter)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 200,
                    strokeDashoffset: 200,
                    animation: `crackDraw 0.15s ease-out forwards`,
                    animationDelay: `${crack.delay}s`,
                  }}
                />
                {/* Core white line */}
                <path
                  d={pathD}
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 200,
                    strokeDashoffset: 200,
                    animation: `crackDraw 0.15s ease-out forwards`,
                    animationDelay: `${crack.delay}s`,
                  }}
                />
              </g>
            )
          })}
          
          {/* Center impact point */}
          <circle 
            cx="50" 
            cy="75" 
            r={stage === "impact" ? "8" : "15"}
            fill="white"
            style={{
              filter: 'url(#glowFilter)',
              animation: 'impactPulse 0.3s ease-out',
            }}
          />
        </svg>
      )}

      {/* Glass shards flying */}
      {stage === "shatter" && shards.map((shard) => (
        <div
          key={shard.id}
          className="absolute pointer-events-none z-30"
          style={{
            left: `${shard.startX}%`,
            top: `${shard.startY}%`,
            width: shard.width,
            height: shard.height,
            background: `linear-gradient(${shard.rotation}deg, 
              rgba(20, 20, 25, ${shard.opacity}) 0%, 
              rgba(10, 10, 15, ${shard.opacity * 0.8}) 50%,
              rgba(30, 30, 35, ${shard.opacity}) 100%)`,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: shard.hasGlow 
              ? `0 0 15px ${shard.glowColor}, inset 0 0 5px rgba(255,255,255,0.1)` 
              : 'inset 0 0 5px rgba(255,255,255,0.1)',
            clipPath: `polygon(
              ${10 + Math.random() * 20}% 0%,
              ${80 + Math.random() * 20}% ${Math.random() * 15}%,
              100% ${50 + Math.random() * 30}%,
              ${70 + Math.random() * 30}% 100%,
              ${Math.random() * 20}% ${85 + Math.random() * 15}%,
              0% ${30 + Math.random() * 20}%
            )`,
            animation: `shardFly ${shard.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            animationDelay: `${shard.delay}s`,
            // @ts-ignore - CSS custom properties
            '--shard-x': `${shard.endX}px`,
            '--shard-y': `${shard.endY}px`,
            '--shard-rotate': `${shard.rotationEnd}deg`,
          }}
        />
      ))}

      {/* Debris/sparks burst */}
      {stage === "shatter" && (
        <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center">
          {debris.map((d) => (
            <div
              key={d.id}
              className="absolute rounded-full"
              style={{
                width: d.size,
                height: d.size,
                background: d.isRed ? '#ef4444' : '#fff',
                boxShadow: `0 0 ${d.size * 3}px ${d.isRed ? '#ef4444' : '#fff'}`,
                animation: `debrisFly ${d.duration}s ease-out forwards`,
                animationDelay: `${d.delay}s`,
                // @ts-ignore
                '--debris-x': `${d.endX}px`,
                '--debris-y': `${d.endY}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Shockwave ring */}
      {stage === "shatter" && (
        <>
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-35"
            style={{
              width: 20,
              height: 20,
              border: '3px solid rgba(239, 68, 68, 0.8)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3)',
              animation: 'shockwave 0.6s ease-out forwards',
            }}
          />
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-35"
            style={{
              width: 20,
              height: 20,
              border: '2px solid rgba(255, 255, 255, 0.6)',
              animation: 'shockwave 0.5s ease-out 0.1s forwards',
            }}
          />
        </>
      )}

      {/* White flash */}
      {(stage === "impact" || stage === "shatter") && (
        <div 
          className="absolute -inset-32 pointer-events-none z-50 rounded-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 60%)',
            animation: 'flashBurst 0.4s ease-out forwards',
          }}
        />
      )}

      {/* The pack itself */}
      <div
        className={cn(
          "relative w-full h-full rounded-xl overflow-hidden transition-all",
          (stage === "shatter" || stage === "reveal") && "opacity-0 scale-90",
        )}
        style={{
          background: 'linear-gradient(145deg, #0d0d12 0%, #1a1a20 50%, #0d0d12 100%)',
          boxShadow: stage === "idle" 
            ? '0 0 30px rgba(239, 68, 68, 0.3), inset 0 0 60px rgba(0,0,0,0.5)'
            : '0 0 60px rgba(239, 68, 68, 0.6), inset 0 0 60px rgba(0,0,0,0.5)',
          transitionDuration: stage === "shatter" ? '0.15s' : '0.3s',
          transform: stage === "impact" ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {/* Animated border glow */}
        <div 
          className="absolute -inset-[2px] rounded-xl pointer-events-none"
          style={{
            background: `conic-gradient(from ${stage === "charging" ? '0deg' : '0deg'}, 
              #ef4444 0%, 
              transparent 30%, 
              #ef4444 50%, 
              transparent 80%, 
              #ef4444 100%)`,
            opacity: stage === "idle" ? 0.5 : 1,
            animation: stage === "charging" ? 'spinGlow 0.5s linear infinite' : 'none',
          }}
        />
        <div 
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(145deg, #0d0d12 0%, #1a1a20 50%, #0d0d12 100%)',
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(239, 68, 68, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(239, 68, 68, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Inner radial glow */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.2) 0%, transparent 70%)',
            opacity: stage === "idle" ? 0.5 : 1,
          }}
        />

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          {/* YOMI Logo */}
          <div className="flex items-baseline">
            <span
              className="font-black text-5xl tracking-tighter"
              style={{
                color: '#ef4444',
                textShadow: '0 0 40px rgba(239, 68, 68, 0.9), 0 0 80px rgba(239, 68, 68, 0.5)',
              }}
            >
              YOMI
            </span>
            <span className="font-semibold text-2xl text-white">.fun</span>
          </div>

          {/* Card icon with pulse */}
          <div
            className={cn(
              "relative w-24 h-24 rounded-xl flex items-center justify-center transition-all duration-300",
              stage === "charging" && "animate-pulse"
            )}
            style={{
              background: 'linear-gradient(145deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              boxShadow: stage === "idle"
                ? '0 0 30px rgba(239, 68, 68, 0.3), inset 0 0 20px rgba(239, 68, 68, 0.1)'
                : '0 0 50px rgba(239, 68, 68, 0.6), inset 0 0 30px rgba(239, 68, 68, 0.2)',
            }}
          >
            <span
              className="text-5xl font-black"
              style={{
                color: '#ef4444',
                textShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
              }}
            >
              ?
            </span>
            
            {/* Charge progress ring */}
            {holdProgress > 0 && stage === "idle" && (
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="rgba(239, 68, 68, 0.3)"
                  strokeWidth="3"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 45}%`,
                    strokeDashoffset: `${(1 - holdProgress / 100) * 2 * Math.PI * 45}%`,
                    filter: 'drop-shadow(0 0 6px #ef4444)',
                  }}
                />
              </svg>
            )}
          </div>

          {/* Instruction */}
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300",
              stage === "idle" ? "opacity-80 text-zinc-400" : "opacity-0"
            )}
          >
            {holdProgress > 0 ? "Chargement..." : "Cliquez pour ouvrir"}
          </span>
        </div>

        {/* Corner accents */}
        {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
          <div 
            key={i}
            className={`absolute ${pos} w-6 h-6 border-l-2 border-t-2 border-primary/40 ${i % 2 === 1 ? 'rotate-90' : ''} ${i >= 2 ? 'rotate-180' : ''} ${i === 3 ? '-rotate-90' : ''}`}
          />
        ))}
      </div>

      {/* Card reveal glow during reveal stage */}
      {stage === "reveal" && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-60"
          style={{
            animation: 'revealGlow 0.6s ease-out forwards',
          }}
        >
          <div 
            className="w-full h-full rounded-xl"
            style={{
              background: 'radial-gradient(ellipse, rgba(239,68,68,0.3) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />
        </div>
      )}

      {/* Keyframe styles */}
      <style jsx>{`
        @keyframes orbit {
          from { transform: rotate(var(--angle, 0deg)) translateX(var(--radius, 100px)) rotate(calc(-1 * var(--angle, 0deg))); }
          to { transform: rotate(calc(var(--angle, 0deg) + 360deg)) translateX(var(--radius, 100px)) rotate(calc(-1 * (var(--angle, 0deg) + 360deg))); }
        }
        
        @keyframes orbitConverge {
          to { transform: rotate(0deg) translateX(0px) scale(2); opacity: 0; }
        }
        
        @keyframes crackDraw {
          to { stroke-dashoffset: 0; }
        }
        
        @keyframes impactPulse {
          0% { r: 0; opacity: 1; }
          50% { r: 15; opacity: 1; }
          100% { r: 25; opacity: 0; }
        }
        
        @keyframes shardFly {
          0% { 
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% { 
            transform: translate(var(--shard-x), var(--shard-y)) rotate(var(--shard-rotate)) scale(0.3);
            opacity: 0;
          }
        }
        
        @keyframes debrisFly {
          0% { 
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% { 
            transform: translate(var(--debris-x), var(--debris-y)) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes shockwave {
          0% { 
            width: 20px;
            height: 20px;
            opacity: 1;
          }
          100% { 
            width: 400px;
            height: 400px;
            opacity: 0;
          }
        }
        
        @keyframes flashBurst {
          0% { opacity: 0; transform: scale(0.5); }
          20% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        
        @keyframes spinGlow {
          to { transform: rotate(360deg); }
        }
        
        @keyframes revealGlow {
          0% { opacity: 1; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
