"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

export function YomiCardPack({
  children,
  onReveal,
}: {
  children: React.ReactNode
  onReveal?: () => void
}) {
  const [stage, setStage] = useState<"idle" | "charging" | "cracking" | "shatter" | "revealed">("idle")

  // Pre-generate crack positions
  const cracks = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const baseAngle = (i / 12) * 360
      return {
        angle: baseAngle,
        length: 50 + Math.random() * 20,
      }
    })
  }, [])

  // Pre-generate shards
  const shards = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => {
      const angle = (i / 16) * 360
      return {
        id: i,
        x: 50 + (Math.random() - 0.5) * 30,
        y: 50 + (Math.random() - 0.5) * 30,
        angle,
        size: 15 + Math.random() * 25,
        delay: i * 0.015,
        translateX: Math.cos((angle * Math.PI) / 180) * (250 + Math.random() * 100),
        translateY: Math.sin((angle * Math.PI) / 180) * (250 + Math.random() * 100),
        rotate: (Math.random() - 0.5) * 720,
      }
    })
  }, [])

  // Pre-generate particles
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const angle = (i / 24) * 360
      const startDistance = 150
      return {
        id: i,
        startX: Math.cos((angle * Math.PI) / 180) * startDistance,
        startY: Math.sin((angle * Math.PI) / 180) * startDistance,
        isRed: i % 2 === 0,
      }
    })
  }, [])

  // Pre-generate sparks
  const sparks = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const angle = (i / 30) * 360 + Math.random() * 20
      const distance = 150 + Math.random() * 100
      return {
        id: i,
        translateX: Math.cos((angle * Math.PI) / 180) * distance,
        translateY: Math.sin((angle * Math.PI) / 180) * distance,
        isWhite: i % 2 === 0,
        isLarge: i % 3 === 0,
        delay: Math.random() * 0.1,
      }
    })
  }, [])

  const handleOpen = () => {
    if (stage !== "idle") return

    setStage("charging")

    setTimeout(() => {
      setStage("cracking")
    }, 600)

    setTimeout(() => {
      setStage("shatter")
    }, 1200)

    setTimeout(() => {
      setStage("revealed")
      onReveal?.()
    }, 1800)
  }

  if (stage === "revealed") {
    return (
      <div className="relative">
        <div className="animate-card-reveal">{children}</div>
      </div>
    )
  }

  return (
    <button
      onClick={handleOpen}
      disabled={stage !== "idle"}
      className={cn(
        "relative w-[320px] aspect-[2/3] rounded-xl overflow-visible cursor-pointer transition-transform duration-300",
        stage === "idle" && "hover:scale-[1.02] active:scale-[0.98]",
        stage === "charging" && "animate-pack-charge",
        stage === "cracking" && "animate-pack-shake",
      )}
    >
      {/* Ambient glow */}
      <div
        className={cn(
          "absolute -inset-12 rounded-3xl pointer-events-none transition-all duration-500",
          stage === "idle" && "opacity-30",
          stage === "charging" && "opacity-80",
          stage === "cracking" && "opacity-100 scale-[1.3]",
          stage === "shatter" && "opacity-0",
        )}
        style={{
          background: "radial-gradient(ellipse, rgba(239, 68, 68, 0.6) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Energy particles during charging */}
      {stage === "charging" && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-2 rounded-full animate-particle-converge"
              style={{
                left: "50%",
                top: "50%",
                background: p.isRed ? "#ef4444" : "#fff",
                boxShadow: `0 0 10px ${p.isRed ? "#ef4444" : "#fff"}`,
                animationDelay: `${p.id * 0.02}s`,
                transform: `translate(${p.startX}px, ${p.startY}px)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Border glow */}
      <div
        className={cn(
          "absolute -inset-[3px] rounded-xl transition-all duration-200",
          stage === "shatter" && "opacity-0",
        )}
        style={{
          background: "#ef4444",
          boxShadow:
            stage === "cracking"
              ? "0 0 40px rgba(239, 68, 68, 1), 0 0 80px rgba(239, 68, 68, 0.7), 0 0 120px rgba(239, 68, 68, 0.5)"
              : "0 0 25px rgba(239, 68, 68, 0.7), 0 0 50px rgba(239, 68, 68, 0.4)",
        }}
      />

      {/* Cracks SVG */}
      {(stage === "cracking" || stage === "shatter") && (
        <svg
          className="absolute inset-0 w-full h-full z-30 pointer-events-none rounded-xl overflow-hidden"
          viewBox="0 0 100 150"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="crackGlowFilter">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {cracks.map((crack, i) => {
            const startX = 50
            const startY = 75
            const endX = startX + Math.cos((crack.angle * Math.PI) / 180) * crack.length
            const endY = startY + Math.sin((crack.angle * Math.PI) / 180) * crack.length * 1.5

            return (
              <g key={i}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="rgba(0,0,0,0.9)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="animate-crack-expand"
                  style={{ animationDelay: `${i * 0.04}s` }}
                />
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#crackGlowFilter)"
                  className="animate-crack-expand"
                  style={{ animationDelay: `${i * 0.04}s` }}
                />
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="white"
                  strokeWidth="1"
                  strokeLinecap="round"
                  className="animate-crack-expand"
                  style={{ animationDelay: `${i * 0.04}s` }}
                />
              </g>
            )
          })}

          <circle cx="50" cy="75" r="5" fill="white" filter="url(#crackGlowFilter)" className="animate-pulse" />
        </svg>
      )}

      {/* Glass shards flying */}
      {stage === "shatter" &&
        shards.map((shard) => (
          <div
            key={shard.id}
            className="absolute z-50 pointer-events-none animate-shard-fly"
            style={{
              left: `${shard.x}%`,
              top: `${shard.y}%`,
              width: `${shard.size}%`,
              height: `${shard.size * 1.2}%`,
              background: "linear-gradient(145deg, #1a1a1f 0%, #0a0a0f 100%)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              boxShadow: "0 0 20px rgba(239, 68, 68, 0.4), inset 0 0 10px rgba(255,255,255,0.1)",
              clipPath: `polygon(
                ${Math.random() * 30}% 0%,
                ${70 + Math.random() * 30}% ${Math.random() * 20}%,
                100% ${60 + Math.random() * 40}%,
                ${60 + Math.random() * 40}% 100%,
                ${Math.random() * 20}% ${80 + Math.random() * 20}%
              )`,
              animationDelay: `${shard.delay}s`,
              // @ts-ignore - CSS custom properties
              "--shard-x": `${shard.translateX}px`,
              "--shard-y": `${shard.translateY}px`,
              "--shard-rotate": `${shard.rotate}deg`,
            }}
          />
        ))}

      {/* Sparks burst */}
      {stage === "shatter" && (
        <div className="absolute inset-0 z-[60] pointer-events-none flex items-center justify-center">
          {sparks.map((spark) => (
            <div
              key={spark.id}
              className="absolute rounded-full animate-spark-burst"
              style={{
                width: spark.isLarge ? "4px" : "2px",
                height: spark.isLarge ? "4px" : "2px",
                background: spark.isWhite ? "#fff" : "#ef4444",
                boxShadow: `0 0 8px ${spark.isWhite ? "#fff" : "#ef4444"}`,
                animationDelay: `${spark.delay}s`,
                // @ts-ignore - CSS custom properties
                "--spark-x": `${spark.translateX}px`,
                "--spark-y": `${spark.translateY}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* White flash on shatter */}
      {stage === "shatter" && (
        <div
          className="absolute -inset-20 z-[55] rounded-3xl animate-flash-burst"
          style={{
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
        />
      )}

      {/* Pack card body */}
      <div
        className={cn(
          "relative w-full h-full rounded-xl overflow-hidden transition-all",
          stage === "shatter" && "opacity-0",
        )}
        style={{
          background: "linear-gradient(145deg, #0a0a0f 0%, #141418 50%, #0a0a0f 100%)",
          transitionDuration: stage === "shatter" ? "0.2s" : "0.3s",
        }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(239, 68, 68, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(239, 68, 68, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Inner glow */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            stage === "charging" || stage === "cracking" ? "opacity-100" : "opacity-50",
          )}
          style={{
            background: "radial-gradient(ellipse at center, rgba(239,68,68,0.15) 0%, transparent 60%)",
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)",
          }}
        />

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          {/* YOMI logo */}
          <div className="flex items-baseline">
            <span
              className="font-black text-5xl tracking-tighter"
              style={{
                color: "#ef4444",
                textShadow: "0 0 40px rgba(239, 68, 68, 0.9), 0 0 80px rgba(239, 68, 68, 0.5)",
              }}
            >
              YOMI
            </span>
            <span className="font-semibold text-2xl text-white">.fun</span>
          </div>

          {/* Mystery icon */}
          <div
            className={cn(
              "relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300",
            )}
            style={{
              background: "radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)",
              border: "2px solid rgba(239, 68, 68, 0.6)",
              boxShadow:
                stage === "charging" || stage === "cracking"
                  ? "0 0 60px rgba(239, 68, 68, 0.8), 0 0 100px rgba(239, 68, 68, 0.5), inset 0 0 40px rgba(239, 68, 68, 0.3)"
                  : "0 0 40px rgba(239, 68, 68, 0.4), inset 0 0 30px rgba(239, 68, 68, 0.15)",
            }}
          >
            <span
              className="text-6xl font-black"
              style={{
                color: "#ef4444",
                textShadow: "0 0 30px rgba(239, 68, 68, 0.9)",
              }}
            >
              ?
            </span>
          </div>

          {/* Tap instruction */}
          <span
            className={cn(
              "text-zinc-500 text-sm font-semibold uppercase tracking-[0.2em] transition-opacity duration-300",
              stage === "idle" ? "opacity-100 animate-pulse" : "opacity-0",
            )}
          >
            Cliquez pour ouvrir
          </span>
        </div>

        {/* Top reflection */}
        <div
          className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)",
          }}
        />
      </div>
    </button>
  )
}
