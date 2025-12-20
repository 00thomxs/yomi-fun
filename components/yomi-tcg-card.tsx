"use client"

import type React from "react"
import { useState, useRef, forwardRef, useEffect, type MouseEvent } from "react"
import { cn } from "@/lib/utils"
import { Target, Crown, Zap, Trophy, Crosshair, Eye, TrendingUp, Medal, Diamond, Swords, Gamepad2, Brain, Award, Skull, Rocket, Drama, Sprout, BadgeCheck, Star, HelpCircle } from "lucide-react"
import type { Badge } from "@/lib/types"
import { CardBackground, AvatarAura, type BackgroundEffect, type AuraEffect } from "./card-cosmetics"
import { StyledUsername, type NametagEffect } from "./ui/styled-username"

// Types
export type CardRank = "iron" | "bronze" | "gold" | "diamond" | "holographic" | "beta"

export interface CardBadge {
  name: string
  description: string
  iconName: string
}

export interface YomiTCGCardProps {
  rank: CardRank
  seasonNumber: string
  seasonTitle: string
  username: string
  level: number
  pnl: number
  winRate: number
  streak: number
  equippedBadges: CardBadge[]
  avatarUrl?: string
  isCapturing?: boolean // Disable effects when capturing image
  // Cosmetics
  backgroundEffect?: { type: string; pattern?: string; effect?: string; colors: string[] } | null
  auraEffect?: { type: string; effect: string; color?: string; colors?: string[]; speed?: string; glow?: boolean; sparkle?: boolean } | null
  nametagEffect?: { type: string; effect?: string; fontFamily?: string; colors?: string[]; useRankColor?: boolean; intensity?: number; direction?: string; color?: string } | null
}

// Icon mapping for badges
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Eye,
  TrendingUp,
  Trophy,
  Medal,
  Diamond,
  Swords,
  Gamepad2,
  Crosshair,
  Brain,
  Crown,
  Award,
  Skull,
  Zap,
  Rocket,
  Drama,
  Sprout,
  BadgeCheck,
  Star,
  Target,
}

const rankStyles: Record<
  CardRank,
  {
    borderColor: string
    glowColor: string
    accentColor: string
    secondaryGlow: string
    bgBase: string
    gridColor: string
    label: string
  }
> = {
  iron: {
    borderColor: "#52525b",
    glowColor: "rgba(82, 82, 91, 0.4)",
    accentColor: "#71717a",
    secondaryGlow: "rgba(113, 113, 122, 0.3)",
    bgBase: "rgba(39, 39, 42, 0.95)",
    gridColor: "rgba(82, 82, 91, 0.15)",
    label: "FER",
  },
  bronze: {
    borderColor: "#ea580c",
    glowColor: "rgba(234, 88, 12, 0.5)",
    accentColor: "#f97316",
    secondaryGlow: "rgba(249, 115, 22, 0.4)",
    bgBase: "rgba(30, 20, 15, 0.95)",
    gridColor: "rgba(234, 88, 12, 0.12)",
    label: "BRONZE",
  },
  gold: {
    borderColor: "#eab308",
    glowColor: "rgba(234, 179, 8, 0.5)",
    accentColor: "#facc15",
    secondaryGlow: "rgba(250, 204, 21, 0.4)",
    bgBase: "rgba(28, 25, 15, 0.95)",
    gridColor: "rgba(234, 179, 8, 0.12)",
    label: "OR",
  },
  diamond: {
    borderColor: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.5)",
    accentColor: "#22d3ee",
    secondaryGlow: "rgba(34, 211, 238, 0.4)",
    bgBase: "rgba(15, 25, 30, 0.95)",
    gridColor: "rgba(6, 182, 212, 0.1)",
    label: "DIAMANT",
  },
  holographic: {
    borderColor: "linear-gradient(135deg, #ffffff, #e8e8e8, #d4d4d8, #ffffff)",
    glowColor: "rgba(255, 255, 255, 0.7)",
    accentColor: "#ffffff",
    secondaryGlow: "rgba(228, 228, 231, 0.6)",
    bgBase: "rgba(30, 30, 40, 0.9)",
    gridColor: "rgba(255, 255, 255, 0.08)",
    label: "HOLOGRAPHIQUE",
  },
  beta: {
    borderColor: "#dc2626",
    glowColor: "rgba(220, 38, 38, 0.6)",
    accentColor: "#ef4444",
    secondaryGlow: "rgba(239, 68, 68, 0.5)",
    bgBase: "rgba(30, 15, 15, 0.95)",
    gridColor: "rgba(220, 38, 38, 0.15)",
    label: "BETA",
  },
}

function StreakBadge({ streak }: { streak: number }) {
  const getFlameColor = () => {
    if (streak >= 20) return "#a855f7" // purple
    if (streak >= 10) return "#f97316" // orange
    if (streak >= 5) return "#ef4444" // red
    if (streak >= 1) return "#06b6d4" // cyan
    return "#52525b" // gray
  }

  if (streak === 0) return null

  const color = getFlameColor()

  return (
    <div
      className="absolute -bottom-2 -right-3 z-20 flex items-center gap-0.5"
      style={{ filter: `drop-shadow(0 0 8px ${color})` }}
    >
      <svg width="18" height="22" viewBox="0 0 24 28" fill="none">
        <path
          d="M12 0C12 0 15 5 15 9C15 11 16 12 17.5 11C19 10 21 12 21 15C21 21 17 26 12 26C7 26 3 21 3 15C3 12 5 10 6.5 11C8 12 9 11 9 9C9 5 12 0 12 0Z"
          fill={color}
        />
      </svg>
      <span className="font-black text-sm" style={{ color: color }}>
        {streak}+
      </span>
    </div>
  )
}

export const YomiTCGCard = forwardRef<HTMLDivElement, YomiTCGCardProps>(({
  rank,
  seasonNumber,
  seasonTitle,
  username,
  level,
  pnl,
  winRate,
  streak,
  equippedBadges,
  avatarUrl = "/placeholder-avatar.png",
  isCapturing = false,
  backgroundEffect,
  auraEffect,
  nametagEffect,
}, ref) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState("")
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 })
  const [gyroEnabled, setGyroEnabled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [needsPermission, setNeedsPermission] = useState(false)
  
  // Smoothing refs for gyroscope
  const targetRotation = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })
  const animationFrame = useRef<number | null>(null)

  // Detect mobile on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      setIsMobile(mobile)
      
      // Check if iOS needs permission request
      if (mobile && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        setNeedsPermission(true)
      } else if (mobile && window.DeviceOrientationEvent) {
        // Android or older iOS - auto-enable
        enableGyroscope()
      }
    }
  }, [])

  // Smooth animation loop for gyroscope
  const animateGyro = () => {
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor
    const smoothFactor = 0.08 // Lower = smoother but slower response
    
    currentRotation.current.x = lerp(currentRotation.current.x, targetRotation.current.x, smoothFactor)
    currentRotation.current.y = lerp(currentRotation.current.y, targetRotation.current.y, smoothFactor)
    
    setTransform(`perspective(1000px) rotateX(${currentRotation.current.x}deg) rotateY(${currentRotation.current.y}deg) scale3d(1.02, 1.02, 1.02)`)
    setGlarePos({
      x: 50 + currentRotation.current.y * 2,
      y: 50 - currentRotation.current.x * 2,
      opacity: 0.2,
    })
    
    animationFrame.current = requestAnimationFrame(animateGyro)
  }

  const handleOrientation = (e: DeviceOrientationEvent) => {
    if (e.gamma === null || e.beta === null) return
    
    // Clamp values to reasonable range
    const gamma = Math.max(-25, Math.min(25, e.gamma)) // Left-right tilt
    const beta = Math.max(-25, Math.min(25, e.beta - 45)) // Front-back tilt (offset for holding phone)
    
    // Store target values (animation loop will smoothly interpolate)
    targetRotation.current.y = gamma / 2.5 // -10 to 10 degrees
    targetRotation.current.x = -beta / 2.5
  }

  // Enable gyroscope (called on user tap for iOS)
  const enableGyroscope = async () => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) return
    
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission()
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation)
          animationFrame.current = requestAnimationFrame(animateGyro)
          setGyroEnabled(true)
          setNeedsPermission(false)
        }
      } catch (err) {
        console.log('Gyro permission denied')
        setNeedsPermission(false)
      }
    } else {
      // Non-iOS or older iOS
      window.addEventListener('deviceorientation', handleOrientation)
      animationFrame.current = requestAnimationFrame(animateGyro)
      setGyroEnabled(true)
    }
  }

  // Clean up listener on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [])

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (gyroEnabled) return // Skip mouse handling if gyro is active
    
    const element = cardRef.current || (ref as React.RefObject<HTMLDivElement>)?.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 12
    const rotateY = (centerX - x) / 12

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`)
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    })
  }

  const handleMouseLeave = () => {
    if (gyroEnabled) return // Skip if gyro is active
    setTransform("")
    setGlarePos({ x: 50, y: 50, opacity: 0 })
  }

  const styles = rankStyles[rank]
  const isHolo = rank === "holographic"
  const isHighRank = rank === "holographic" || rank === "diamond" || rank === "gold"
  const pnlColor = pnl >= 0 ? "#22c55e" : "#ef4444"
  const pnlPrefix = pnl >= 0 ? "+" : ""

  // Get badges to display (max 2)
  const displayBadges = equippedBadges.slice(0, 2)

  // Handle tap to enable gyroscope on iOS
  const handleTap = () => {
    if (isMobile && needsPermission) {
      enableGyroscope()
    }
  }

  // When capturing, disable all transforms to get a straight card
  const effectiveTransform = isCapturing ? "" : transform

  return (
    <div
      ref={ref || cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleTap}
      className="relative cursor-pointer transition-transform duration-200 ease-out group"
      style={{ transform: effectiveTransform, transformStyle: "preserve-3d" }}
    >
      {/* Super Saiyan Aura Effect - excluded from download */}
      <div className="aura-effect absolute -inset-3 z-0 pointer-events-none overflow-visible">
        {/* Pulsing aura background */}
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(ellipse 100% 80% at 50% 100%, ${styles.glowColor} 0%, transparent 50%),
                        radial-gradient(ellipse 80% 60% at 50% 0%, ${styles.secondaryGlow} 0%, transparent 40%)`,
            animation: 'auraPulse 2s ease-in-out infinite',
          }}
        />
        {/* Rising energy particles */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 rounded-full"
            style={{
              height: 6 + (i % 3) * 4,
              left: `${8 + i * 9}%`,
              bottom: 0,
              background: `linear-gradient(to top, ${styles.accentColor}, transparent)`,
              animation: `auraRise ${1.2 + (i % 4) * 0.3}s ease-out infinite`,
              animationDelay: `${i * 0.12}s`,
              opacity: 0.6,
            }}
          />
        ))}
        {/* Outer glow ring */}
        <div 
          className="absolute -inset-1 rounded-2xl"
          style={{
            border: `1px solid ${styles.accentColor}30`,
            boxShadow: `0 0 15px ${styles.glowColor}, 0 0 30px ${styles.secondaryGlow}`,
            animation: 'auraGlow 1.5s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Outer glow */}
      <div
        className="absolute -inset-1 rounded-2xl transition-all duration-300"
        style={{
          background: isHolo
            ? `linear-gradient(135deg, #ffffff, #e4e4e7, #a1a1aa, #e4e4e7, #ffffff)`
            : styles.borderColor,
          filter: isHolo ? "blur(20px)" : "blur(15px)",
          opacity: isHolo ? 0.9 : 0.7,
        }}
      />

      {isHolo ? (
        <div
          className="absolute -inset-[4px] rounded-2xl z-10 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, #ffffff 0%, #e4e4e7 25%, #a1a1aa 50%, #e4e4e7 75%, #ffffff 100%)`,
            backgroundSize: "200% 200%",
            animation: "shimmer 3s ease-in-out infinite",
            boxShadow: `0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(228, 228, 231, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)`,
          }}
        />
      ) : (
        <div
          className="absolute -inset-[4px] rounded-2xl z-10"
          style={{
            background: styles.borderColor,
            boxShadow: `0 0 30px ${styles.glowColor}, 0 0 60px ${styles.secondaryGlow}`,
          }}
        />
      )}

      {/* Card body */}
      <div
        className="relative w-[320px] aspect-[2/3] rounded-xl overflow-hidden z-20"
        style={{ background: styles.bgBase }}
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${styles.glowColor}50 0%, transparent 70%)`,
          }}
        />

        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 80% 10%, ${styles.glowColor}30 0%, transparent 60%)`,
          }}
        />

        {/* Grid background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(${styles.gridColor} 1px, transparent 1px),
              linear-gradient(90deg, ${styles.gridColor} 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Custom Background Effect (from cosmetics) */}
        {backgroundEffect && !isCapturing && (
          <CardBackground effect={backgroundEffect as BackgroundEffect} />
        )}

        {/* Ambient glow effects */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${styles.glowColor}10 0%, transparent 70%)`,
            opacity: 0.15,
          }}
        />

        {/* Holographic foil overlay */}
        {isHolo && (
          <div
            className="absolute inset-0 z-30 pointer-events-none opacity-20"
            style={{
              background: `linear-gradient(
                135deg,
                rgba(255,255,255,0.15) 0%,
                rgba(255,255,255,0) 40%,
                rgba(255,255,255,0) 60%,
                rgba(255,255,255,0.1) 100%
              )`,
            }}
          />
        )}

        {/* Glare effect */}
        <div
          className="absolute inset-0 pointer-events-none z-40 transition-opacity duration-150"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}) 0%, transparent 50%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-20 h-full flex flex-col p-4">
          {/* Header - Logo left, Level right */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="flex items-baseline">
                {isHolo ? (
                  <>
                    <span
                      className="font-black text-xl tracking-tight"
                      style={{
                        background:
                          "linear-gradient(135deg, #ff3333 0%, #ff9500 15%, #00d4ff 35%, #ff00ff 55%, #0066ff 75%, #8b00ff 90%, #ff3333 100%)",
                        backgroundSize: "200% 200%",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter: "drop-shadow(0 0 10px rgba(255,255,255,0.7))",
                      }}
                    >
                      YOMI
                    </span>
                    <span
                      className="font-semibold text-sm"
                      style={{
                        background: "linear-gradient(135deg, #00d4ff 0%, #ff00ff 50%, #ff3333 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      .fun
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className="font-black text-xl tracking-tight"
                      style={{ color: "#ef4444", textShadow: "0 0 20px rgba(239, 68, 68, 0.9)" }}
                    >
                      YOMI
                    </span>
                    <span className="font-semibold text-sm text-white">.fun</span>
                  </>
                )}
              </div>
              {/* Season tag */}
              <div
                className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap"
                style={{
                  background: rank === 'beta' ? 'rgba(234, 179, 8, 0.15)' : `${styles.accentColor}15`,
                  border: rank === 'beta' ? '1px solid rgba(234, 179, 8, 0.5)' : `1px solid ${styles.accentColor}40`,
                  color: rank === 'beta' ? '#facc15' : styles.accentColor,
                }}
              >
                {rank === 'beta' && <Star className="w-2.5 h-2.5" style={{ color: '#facc15' }} />}
                <span>
                {rank === 'beta' 
                    ? 'BETA TESTEUR' 
                  : seasonNumber === '0' 
                    ? 'HORS SAISON'
                      : `S${seasonNumber} : ${seasonTitle}`}
                </span>
                {rank === 'beta' && <Star className="w-2.5 h-2.5" style={{ color: '#facc15' }} />}
              </div>
            </div>
            <div className="flex flex-col items-end" style={{ filter: `drop-shadow(0 0 10px ${styles.glowColor})` }}>
              <span className="text-[10px] font-semibold font-mono uppercase tracking-wider text-zinc-400">Niveau</span>
              <span
                className="font-black text-3xl font-mono"
                style={{
                  color: styles.accentColor,
                  textShadow: `0 0 15px ${styles.glowColor}`,
                }}
              >
                {level}
              </span>
            </div>
          </div>

          {/* Avatar section */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative mb-4">
              <div
                className="absolute -inset-4 rounded-full"
                style={{
                  background: isHolo
                    ? `conic-gradient(from 180deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #8b5cf6, #ec4899, #ef4444)`
                    : `radial-gradient(circle, ${styles.accentColor} 0%, ${styles.accentColor} 40%, transparent 70%)`,
                  filter: "blur(10px)",
                  opacity: isHolo ? 0.7 : 0.9,
                  animation: "pulse-glow 3s ease-in-out infinite",
                }}
              />
              <div
                className="absolute -inset-2 rounded-full"
                style={{
                  background: isHolo
                    ? `radial-gradient(circle, ${styles.accentColor}40 0%, ${styles.accentColor}20 50%, transparent 70%)`
                    : `radial-gradient(circle, ${styles.accentColor}90 0%, ${styles.accentColor}60 40%, transparent 70%)`,
                  filter: "blur(6px)",
                }}
              />
              {/* Avatar Aura Effect (from cosmetics) */}
              {auraEffect && !isCapturing && (
                <AvatarAura effect={auraEffect as AuraEffect} />
              )}
              {/* Avatar image */}
              <div
                className="relative w-28 h-28 rounded-full overflow-hidden bg-zinc-900"
                style={{
                  boxShadow: isHolo
                    ? `0 0 20px ${styles.glowColor}, 0 0 40px ${styles.glowColor}50, inset 0 0 20px rgba(0,0,0,0.5)`
                    : `0 0 25px ${styles.accentColor}, 0 0 50px ${styles.glowColor}, 0 0 70px ${styles.glowColor}80, inset 0 0 20px rgba(0,0,0,0.5)`,
                }}
              >
                <img src={avatarUrl || "/placeholder.svg"} alt={username} className="w-full h-full object-cover" />
              </div>
              {/* Streak badge */}
              <StreakBadge streak={streak} />
            </div>

            {/* Username */}
            <h2
              className="text-white font-black text-xl tracking-tight mb-3"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
            >
              {nametagEffect && !isCapturing ? (
                <StyledUsername
                  username={username}
                  nametagEffect={nametagEffect as NametagEffect}
                  rankColor={styles.accentColor}
                  withAt
                />
              ) : (
                `@${username}`
              )}
            </h2>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-zinc-400 text-[10px] font-semibold font-mono uppercase block">PnL</span>
                <span
                  className="font-mono font-black text-lg block"
                  style={{ color: pnlColor, textShadow: `0 0 10px ${pnlColor}60` }}
                >
                  {pnlPrefix}
                  {Math.abs(pnl).toLocaleString()} Ƶ
                </span>
              </div>
              <div
                className="w-px h-8"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${styles.accentColor}50, transparent)`,
                }}
              />
              <div className="text-center">
                <span className="text-zinc-400 text-[10px] font-semibold font-mono uppercase block">Win Rate</span>
                <span
                  className="font-mono font-black text-lg block"
                  style={{
                    color: styles.accentColor,
                    textShadow: `0 0 8px ${styles.glowColor}`,
                  }}
                >
                  {winRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Badges section */}
          <div className="space-y-2 mb-4">
            {displayBadges.length > 0 ? (
              displayBadges.map((badge, i) => {
                const IconComponent = ICON_MAP[badge.iconName] || HelpCircle
                return (
                  <div
                    key={i}
                    className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 overflow-hidden"
                    style={{
                      background: `linear-gradient(90deg, ${styles.accentColor}15 0%, transparent 100%)`,
                      border: `1px solid ${styles.accentColor}40`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                      style={{
                        background: `${styles.accentColor}20`,
                        border: `1px solid ${styles.accentColor}60`,
                      }}
                    >
                      <IconComponent className="h-4 w-4" style={{ color: styles.accentColor }} />
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                      <span
                        className="font-black text-sm uppercase tracking-wide shrink-0"
                        style={{
                          color: styles.accentColor,
                          textShadow: `0 0 10px ${styles.glowColor}`,
                        }}
                      >
                        {badge.name}
                      </span>
                      <span className="text-zinc-300 text-[10px] text-right leading-tight truncate">{badge.description}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              // Placeholder for no badges
              <div
                className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 opacity-50"
                style={{
                  background: `linear-gradient(90deg, ${styles.accentColor}10 0%, transparent 100%)`,
                  border: `1px dashed ${styles.accentColor}30`,
                }}
              >
                <span className="text-zinc-500 text-xs italic">Aucun badge équipé</span>
              </div>
            )}
          </div>
        </div>

        {/* Scan lines */}
        <div
          className="absolute inset-0 pointer-events-none z-30 opacity-[0.015]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
          }}
        />
      </div>

      {/* Aura animations */}
      <style jsx>{`
        @keyframes auraPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        @keyframes auraRise {
          0% { transform: translateY(0) scaleY(1); opacity: 0.6; }
          100% { transform: translateY(-50px) scaleY(1.5); opacity: 0; }
        }
        @keyframes auraGlow {
          0% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
})

YomiTCGCard.displayName = "YomiTCGCard"

// Export rank styles for external use
export { rankStyles }
