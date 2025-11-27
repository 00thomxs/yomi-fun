"use client"

import type { ReactNode } from "react"

interface NavButtonProps {
  icon: ReactNode
  label: string
  active: boolean
  onClick: () => void
}

export function NavButton({ icon, label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-lg transition-all ${
        active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

