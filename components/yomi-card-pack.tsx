"use client"

import type React from "react"
import { useState, useMemo } from "react"
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

  // Glass shards - TRUE 3D with depth
  const shards = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => {
      const ring = Math.floor(i / 12)
      const angleBase = (i % 12) * 30 + Math.random() * 15
      
      // 3D trajectory - some fly toward camera, some away
      const zDirection = Math.random() > 0.5 ? 1 : -1
      const zDistance = 100 + Math.random() * 300
      const xyDistance = 150 + ring * 50 + Math.random() * 80
      
      return {
        id: i,
        // Start position
        startX: 50 + (Math.random() - 0.5) * 50,
        startY: 50 + (Math.random() - 0.5) * 70,
        startZ: 0,
        // End position (3D)
        endX: Math.cos((angleBase * Math.PI) / 180) * xyDistance,
        endY: Math.sin((angleBase * Math.PI) / 180) * xyDistance,
        endZ: zDirection * zDistance,
        // Size
        width: 15 + Math.random() * 35,
        height: 20 + Math.random() * 45,
        // Rotation on ALL axes
        rotateX: (Math.random() - 0.5) * 720,
        rotateY: (Math.random() - 0.5) * 720,
        rotateZ: (Math.random() - 0.5) * 540,
        // Timing
        delay: ring * 0.015 + Math.random() * 0.03,
        duration: 0.7 + Math.random() * 0.4,
        // Visual
        hasGlow: Math.random() > 0.6,
        hasReflection: Math.random() > 0.5,
        reflectionAngle: Math.random() * 180,
      }
    })
  }, [])

  // Debris with 3D depth
  const debris = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => {
      const angle = Math.random() * 360
      const distance = 100 + Math.random() * 250
      const zDir = Math.random() > 0.5 ? 1 : -1
      
      return {
        id: i,
        endX: Math.cos((angle * Math.PI) / 180) * distance,
        endY: Math.sin((angle * Math.PI) / 180) * distance,
        endZ: zDir * (50 + Math.random() * 150),
        size: 2 + Math.random() * 5,
        delay: Math.random() * 0.1,
        duration: 0.3 + Math.random() * 0.4,
        isRed: Math.random() > 0.4,
        isBright: Math.random() > 0.7,
      }
    })
  }, [])

  // Lightning cracks with branching
  const cracks = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => {
      const angle = (i / 20) * 360
      const segments: { x: number; y: number }[] = []
      let x = 0, y = 0
      const length = 50 + Math.random() * 40
      const steps = 5 + Math.floor(Math.random() * 4)
      
      for (let s = 0; s < steps; s++) {
        const stepLen = length / steps
        const deviation = (Math.random() - 0.5) * 25
        x += Math.cos(((angle + deviation) * Math.PI) / 180) * stepLen
        y += Math.sin(((angle + deviation) * Math.PI) / 180) * stepLen
        segments.push({ x, y })
      }
      
      // Add branches
      const branches: { startIdx: number; segments: { x: number; y: number }[] }[] = []
      if (Math.random() > 0.5) {
        const branchStart = Math.floor(Math.random() * (segments.length - 1))
        const branchAngle = angle + (Math.random() > 0.5 ? 30 : -30) + Math.random() * 20
        let bx = segments[branchStart].x
        let by = segments[branchStart].y
        const branchSegs: { x: number; y: number }[] = []
        for (let b = 0; b < 2; b++) {
          bx += Math.cos((branchAngle * Math.PI) / 180) * 15
          by += Math.sin((branchAngle * Math.PI) / 180) * 15
          branchSegs.push({ x: bx, y: by })
        }
        branches.push({ startIdx: branchStart, segments: branchSegs })
      }
      
      return { id: i, angle, segments, branches, delay: i * 0.02 }
    })
  }, [])

  // Smoke/dust particles
  const smoke = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 50 + (Math.random() - 0.5) * 80,
      size: 30 + Math.random() * 50,
      delay: 0.1 + Math.random() * 0.2,
      duration: 1 + Math.random() * 0.5,
    }))
  }, [])

  const triggerOpen = () => {
    if (stage !== "idle") return
    
    setStage("charging")
    
    setTimeout(() => setStage("impact"), 350)
    setTimeout(() => setStage("shatter"), 500)
    setTimeout(() => setStage("reveal"), 1300)
    setTimeout(() => {
      setStage("revealed")
      onReveal?.()
    }, 1900)
  }

  if (stage === "revealed") {
    return (
      <div className="relative" style={{ perspective: '1000px' }}>
        <div 
          className="animate-in zoom-in-95 fade-in duration-500"
          style={{ 
            animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            transformStyle: 'preserve-3d',
          }}
        >
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={triggerOpen}
      className={cn(
        "relative w-[320px] aspect-[2/3] cursor-pointer select-none",
        stage === "idle" && "hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
      )}
      style={{ 
        perspective: '1200px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      {/* Ambient 3D glow */}
      <div
        className={cn(
          "absolute -inset-20 rounded-full pointer-events-none transition-all",
          stage === "idle" && "opacity-30",
          stage === "charging" && "opacity-80 scale-125",
          stage === "impact" && "opacity-100 scale-150",
          stage === "shatter" && "opacity-60",
          stage === "reveal" && "opacity-0",
        )}
        style={{
          background: `radial-gradient(ellipse, 
            rgba(239, 68, 68, ${stage === "impact" ? 0.9 : 0.5}) 0%, 
            rgba(239, 68, 68, 0.2) 40%,
            transparent 70%)`,
          filter: 'blur(40px)',
          transitionDuration: stage === "impact" ? '0.08s' : '0.3s',
        }}
      />

      {/* Charging energy spiral */}
      {stage === "charging" && (
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
        >
          {Array.from({ length: 40 }).map((_, i) => {
            const angle = (i / 40) * 360 * 3 // 3 rotations
            const radius = 60 + i * 2
            const z = -100 + i * 5
            return (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                style={{
                  background: i % 2 === 0 ? '#ef4444' : '#fff',
                  boxShadow: `0 0 10px ${i % 2 === 0 ? '#ef4444' : '#fff'}`,
                  transform: `
                    translateX(-50%) translateY(-50%)
                    rotateY(${angle}deg) 
                    translateX(${radius}px)
                    translateZ(${z}px)
                  `,
                  animation: `spiralIn 0.35s ease-in forwards`,
                  animationDelay: `${i * 0.005}s`,
                  opacity: 0.8,
                }}
              />
            )
          })}
        </div>
      )}

      {/* Lightning cracks */}
      {(stage === "impact" || stage === "shatter") && (
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
          viewBox="-50 -75 200 300"
          style={{ transform: 'translate(-25%, -25%) scale(1.5)' }}
        >
          <defs>
            <filter id="electricGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
            <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2"/>
            </filter>
          </defs>
          
          {cracks.map((crack) => {
            const mainPath = `M 50 75 ${crack.segments.map(s => `L ${50 + s.x} ${75 + s.y}`).join(' ')}`
            return (
              <g key={crack.id}>
                {/* Outer glow */}
                <path
                  d={mainPath}
                  stroke="#ef4444"
                  strokeWidth="8"
                  fill="none"
                  filter="url(#electricGlow)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.6"
                  style={{
                    strokeDasharray: 300,
                    strokeDashoffset: 300,
                    animation: `crackDraw 0.12s ease-out forwards`,
                    animationDelay: `${crack.delay}s`,
                  }}
                />
                {/* Core */}
                <path
                  d={mainPath}
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 300,
                    strokeDashoffset: 300,
                    animation: `crackDraw 0.12s ease-out forwards`,
                    animationDelay: `${crack.delay}s`,
                  }}
                />
                {/* Branches */}
                {crack.branches.map((branch, bi) => {
                  const branchPath = `M ${50 + crack.segments[branch.startIdx].x} ${75 + crack.segments[branch.startIdx].y} ${branch.segments.map(s => `L ${50 + s.x} ${75 + s.y}`).join(' ')}`
                  return (
                    <path
                      key={bi}
                      d={branchPath}
                      stroke="white"
                      strokeWidth="1"
                      fill="none"
                      opacity="0.7"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: 100,
                        strokeDashoffset: 100,
                        animation: `crackDraw 0.1s ease-out forwards`,
                        animationDelay: `${crack.delay + 0.05}s`,
                      }}
                    />
                  )
                })}
              </g>
            )
          })}
          
          {/* Impact core */}
          <circle 
            cx="50" cy="75" r="3"
            fill="white"
            filter="url(#coreGlow)"
          >
            <animate attributeName="r" values="3;20;30" dur="0.3s" fill="freeze"/>
            <animate attributeName="opacity" values="1;0.8;0" dur="0.3s" fill="freeze"/>
          </circle>
        </svg>
      )}

      {/* 3D Glass shards */}
      {stage === "shatter" && (
        <div 
          className="absolute inset-0 pointer-events-none z-30"
          style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
        >
          {shards.map((shard) => (
            <div
              key={shard.id}
              className="absolute"
              style={{
                left: `${shard.startX}%`,
                top: `${shard.startY}%`,
                width: shard.width,
                height: shard.height,
                transformStyle: 'preserve-3d',
                animation: `shard3D ${shard.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                animationDelay: `${shard.delay}s`,
                // @ts-ignore
                '--end-x': `${shard.endX}px`,
                '--end-y': `${shard.endY}px`,
                '--end-z': `${shard.endZ}px`,
                '--rot-x': `${shard.rotateX}deg`,
                '--rot-y': `${shard.rotateY}deg`,
                '--rot-z': `${shard.rotateZ}deg`,
              }}
            >
              {/* Shard face */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(${shard.reflectionAngle}deg, 
                    rgba(30, 30, 35, 0.95) 0%, 
                    rgba(15, 15, 20, 0.9) 40%,
                    rgba(40, 40, 50, 0.95) 100%)`,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  clipPath: `polygon(
                    ${5 + Math.random() * 15}% 0%,
                    ${85 + Math.random() * 15}% ${Math.random() * 10}%,
                    100% ${45 + Math.random() * 20}%,
                    ${75 + Math.random() * 25}% 100%,
                    ${Math.random() * 15}% ${90 + Math.random() * 10}%,
                    0% ${35 + Math.random() * 20}%
                  )`,
                  boxShadow: shard.hasGlow 
                    ? `0 0 20px rgba(239, 68, 68, 0.5), inset 0 1px 1px rgba(255,255,255,0.2)` 
                    : 'inset 0 1px 1px rgba(255,255,255,0.15)',
                }}
              >
                {/* Glass reflection */}
                {shard.hasReflection && (
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `linear-gradient(${shard.reflectionAngle + 45}deg, 
                        transparent 40%, 
                        rgba(255,255,255,0.4) 50%, 
                        transparent 60%)`,
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3D Debris/sparks */}
      {stage === "shatter" && (
        <div 
          className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center"
          style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
        >
          {debris.map((d) => (
            <div
              key={d.id}
              className="absolute rounded-full"
              style={{
                width: d.size,
                height: d.size,
                background: d.isBright ? '#fff' : (d.isRed ? '#ef4444' : '#ff8888'),
                boxShadow: `0 0 ${d.size * 2}px ${d.isBright ? '#fff' : (d.isRed ? '#ef4444' : '#ff8888')}`,
                animation: `debris3D ${d.duration}s ease-out forwards`,
                animationDelay: `${d.delay}s`,
                // @ts-ignore
                '--end-x': `${d.endX}px`,
                '--end-y': `${d.endY}px`,
                '--end-z': `${d.endZ}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Smoke/dust clouds */}
      {stage === "shatter" && smoke.map((s) => (
        <div
          key={s.id}
          className="absolute pointer-events-none z-25 rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: 'radial-gradient(circle, rgba(60,60,70,0.4) 0%, transparent 70%)',
            filter: 'blur(8px)',
            animation: `smokeRise ${s.duration}s ease-out forwards`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Shockwave rings */}
      {stage === "shatter" && (
        <>
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-35"
            style={{
              width: 10,
              height: 10,
              border: '4px solid rgba(239, 68, 68, 0.9)',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.4)',
              animation: 'shockwave 0.5s ease-out forwards',
            }}
          />
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-35"
            style={{
              width: 10,
              height: 10,
              border: '2px solid rgba(255, 255, 255, 0.8)',
              animation: 'shockwave 0.4s ease-out 0.08s forwards',
            }}
          />
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-35"
            style={{
              width: 10,
              height: 10,
              border: '1px solid rgba(239, 68, 68, 0.5)',
              animation: 'shockwave 0.6s ease-out 0.15s forwards',
            }}
          />
        </>
      )}

      {/* Intense flash */}
      {(stage === "impact" || stage === "shatter") && (
        <div 
          className="absolute -inset-40 pointer-events-none z-50 rounded-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,200,200,0.5) 30%, transparent 60%)',
            animation: 'flashBurst 0.35s ease-out forwards',
          }}
        />
      )}

      {/* The pack */}
      <div
        className={cn(
          "relative w-full h-full rounded-xl overflow-hidden transition-all",
          stage === "charging" && "scale-[1.02]",
          stage === "impact" && "scale-[1.08]",
          (stage === "shatter" || stage === "reveal") && "opacity-0 scale-75",
        )}
        style={{
          background: 'linear-gradient(145deg, #0d0d12 0%, #1a1a22 50%, #0d0d12 100%)',
          boxShadow: stage === "idle" 
            ? '0 0 40px rgba(239, 68, 68, 0.3), 0 20px 60px rgba(0,0,0,0.5)'
            : '0 0 80px rgba(239, 68, 68, 0.7), 0 20px 60px rgba(0,0,0,0.5)',
          transitionDuration: stage === "shatter" ? '0.1s' : (stage === "impact" ? '0.08s' : '0.25s'),
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Animated conic border */}
        <div 
          className="absolute -inset-[2px] rounded-xl pointer-events-none"
          style={{
            background: stage === "charging" 
              ? `conic-gradient(from 0deg, #ef4444, #ff6b6b, #ef4444, #ff6b6b, #ef4444)`
              : `conic-gradient(from 0deg, #ef4444 0%, transparent 25%, #ef4444 50%, transparent 75%, #ef4444 100%)`,
            opacity: stage === "idle" ? 0.6 : 1,
            animation: stage === "charging" ? 'spinBorder 0.3s linear infinite' : 'none',
          }}
        />
        <div 
          className="absolute inset-0 rounded-xl"
          style={{ background: 'linear-gradient(145deg, #0d0d12 0%, #1a1a22 50%, #0d0d12 100%)' }}
        />

        {/* Tactical grid */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `
              linear-gradient(rgba(239, 68, 68, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(239, 68, 68, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Inner glow */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, 
              rgba(239,68,68,${stage === "charging" || stage === "impact" ? 0.35 : 0.15}) 0%, 
              transparent 60%)`,
            transition: 'all 0.2s',
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
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

          <div
            className={cn(
              "relative w-24 h-24 rounded-xl flex items-center justify-center",
              stage === "charging" && "animate-pulse"
            )}
            style={{
              background: 'linear-gradient(145deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              boxShadow: `0 0 ${stage === "charging" ? 60 : 30}px rgba(239, 68, 68, ${stage === "charging" ? 0.6 : 0.3})`,
              transition: 'all 0.2s',
            }}
          >
            <span
              className="text-5xl font-black"
              style={{
                color: '#ef4444',
                textShadow: '0 0 25px rgba(239, 68, 68, 0.9)',
              }}
            >
              ?
            </span>
          </div>

          <span
            className={cn(
              "text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 transition-opacity",
              stage === "idle" ? "opacity-70" : "opacity-0"
            )}
          >
            Cliquez pour ouvrir
          </span>
        </div>

        {/* Corner brackets */}
        {['top-4 left-4', 'top-4 right-4 rotate-90', 'bottom-4 left-4 -rotate-90', 'bottom-4 right-4 rotate-180'].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-5 h-5 border-l-2 border-t-2 border-primary/50`}/>
        ))}
      </div>

      {/* Reveal glow */}
      {stage === "reveal" && (
        <div 
          className="absolute inset-0 pointer-events-none z-60 flex items-center justify-center"
          style={{ animation: 'revealPulse 0.6s ease-out forwards' }}
        >
          <div 
            className="w-[150%] h-[150%] rounded-2xl"
            style={{
              background: 'radial-gradient(ellipse, rgba(239,68,68,0.4) 0%, transparent 60%)',
              filter: 'blur(30px)',
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes spiralIn {
          to { 
            transform: translateX(-50%) translateY(-50%) rotateY(720deg) translateX(0px) translateZ(50px) scale(3);
            opacity: 0;
          }
        }
        
        @keyframes crackDraw {
          to { stroke-dashoffset: 0; }
        }
        
        @keyframes shard3D {
          0% { 
            transform: translate3d(0, 0, 0) rotateX(0) rotateY(0) rotateZ(0) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
          100% { 
            transform: translate3d(var(--end-x), var(--end-y), var(--end-z)) 
                       rotateX(var(--rot-x)) rotateY(var(--rot-y)) rotateZ(var(--rot-z)) 
                       scale(0.4);
            opacity: 0;
            filter: blur(2px);
          }
        }
        
        @keyframes debris3D {
          0% { 
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
          100% { 
            transform: translate3d(var(--end-x), var(--end-y), var(--end-z)) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes smokeRise {
          0% { 
            transform: scale(0.5) translateY(0);
            opacity: 0.6;
          }
          100% { 
            transform: scale(2) translateY(-40px);
            opacity: 0;
          }
        }
        
        @keyframes shockwave {
          0% { 
            width: 10px;
            height: 10px;
            opacity: 1;
          }
          100% { 
            width: 500px;
            height: 500px;
            opacity: 0;
          }
        }
        
        @keyframes flashBurst {
          0% { opacity: 0; transform: scale(0.3); }
          15% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.8); }
        }
        
        @keyframes spinBorder {
          to { transform: rotate(360deg); }
        }
        
        @keyframes revealPulse {
          0% { opacity: 1; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}
