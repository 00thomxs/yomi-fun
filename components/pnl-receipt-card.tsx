"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Upload, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { YomiLogo } from "@/components/ui/yomi-logo"

interface PnlData {
  pnlPercentage: number
  pnlAmount: number // Added pnlAmount field
  event: string
  sens: string // sens can now be any string for multi-choice bets
  mise: number
  date: string
}

interface PnlReceiptCardProps {
  data?: PnlData
}

const defaultData: PnlData = {
  pnlPercentage: 420,
  pnlAmount: 2420000, // Added default amount
  event: "GAME OF THE YEAR 2025 : Clair Obscur: Expedition 33",
  sens: "OUI",
  mise: 25000,
  date: "12/12/2024",
}

export function PnlReceiptCard({ data = defaultData }: PnlReceiptCardProps) {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPositive = data.pnlPercentage >= 0
  const pnlDisplay = `${isPositive ? "+" : ""}${data.pnlPercentage.toLocaleString("fr-FR")}%`
  const pnlAmountDisplay = `${isPositive ? "+" : ""}${data.pnlAmount.toLocaleString("fr-FR")} Ƶ`

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDownload = async () => {
    if (!cardRef.current) return

    const { toPng } = await import("html-to-image")
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      })
      const link = document.createElement("a")
      link.download = `yomi-pnl-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("Error generating image:", err)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* The Receipt Card - 4:5 Aspect Ratio */}
      <div
        ref={cardRef}
        className="relative w-[400px] overflow-hidden rounded-lg border border-red-600/30"
        style={{ aspectRatio: "4/5" }}
      >
        {/* Layer 0: Background - Image or Grid */}
        <div className="absolute inset-0">
          {backgroundImage ? (
            <img
              src={backgroundImage}
              alt="Background"
              className="h-full w-full object-cover brightness-[0.55] contrast-125 grayscale-[0.4]"
            />
          ) : (
            <div 
              className="h-full w-full bg-black"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px"
              }}
            />
          )}
        </div>

        {/* Tactical Grid Overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />

        <div className="absolute inset-0 flex flex-col p-6">
          <div className="relative flex h-full w-full flex-col items-center px-4 py-6">
            {/* Layer 2: Content */}
            <div className="relative z-10 flex h-full w-full flex-col items-center">
              <div className="flex flex-col items-center justify-center py-4">
                <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Gains</span>
                <span
                  className="mt-1 font-mono text-6xl font-extrabold leading-none tracking-tight text-emerald-400"
                  style={{
                    textShadow: "0 0 30px rgba(52, 211, 153, 0.5), 0 0 60px rgba(52, 211, 153, 0.3)",
                  }}
                >
                  {pnlDisplay}
                </span>
                <span className="mt-1 font-mono text-sm text-zinc-400">
                  PnL : <span className="text-emerald-400">{pnlAmountDisplay}</span>
                </span>
              </div>

              {/* Data Table */}
              <div className="mt-4 w-full space-y-3 font-mono text-sm">
                <DataRow label="EVENT" value={data.event} isEvent maxLength={60} />
                <DataRow
                  label="CHOIX"
                  value={data.sens}
                  maxLength={22}
                  valueColor={
                    data.sens.toUpperCase().startsWith("OUI")
                      ? "text-emerald-400"
                      : data.sens.toUpperCase().startsWith("NON")
                        ? "text-red-500"
                        : "text-white"
                  }
                />
                <DataRow label="MISE" value={`${data.mise.toLocaleString("fr-FR")} Ƶ`} />
                <DataRow label="DATE" value={data.date} />
              </div>

              <div className="mt-auto flex w-full items-center justify-center pt-6">
                <div className="scale-90">
                  <YomiLogo />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2 border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
        >
          <Upload className="h-4 w-4" />
          Changer le fond
        </Button>
        <Button
          variant="outline"
          onClick={handleDownload}
          className="gap-2 border-red-600 bg-zinc-950 text-red-600 hover:bg-red-600/10"
        >
          <Download className="h-4 w-4" />
          Télécharger l'image
        </Button>
      </div>
    </div>
  )
}

function DataRow({
  label,
  value,
  valueColor = "text-white",
  isEvent = false,
  maxLength = 25,
}: {
  label: string
  value: string
  valueColor?: string
  isEvent?: boolean
  maxLength?: number
}) {
  const labelColor = isEvent ? "text-red-600" : "text-zinc-400"
  
  // Truncate value if too long
  const displayValue = value.length > maxLength 
    ? value.substring(0, maxLength) + "..." 
    : value

  return (
    <div className={`flex ${isEvent ? "flex-col gap-1" : "items-center gap-2"}`}>
      {isEvent ? (
        <>
          <span className={labelColor}>{label}</span>
          <span className={`${valueColor} text-sm leading-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`}>
            {displayValue}
          </span>
        </>
      ) : (
        <>
          <span className={`w-14 shrink-0 ${labelColor}`}>{label}</span>
          <span className="flex-1 overflow-hidden whitespace-nowrap text-zinc-600">{"·".repeat(50)}</span>
          <span className={`${valueColor} shrink-0 text-right drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`}>
            {displayValue}
          </span>
        </>
      )}
    </div>
  )
}
