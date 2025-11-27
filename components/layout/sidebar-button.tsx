"use client"

import type { ReactNode } from "react"

interface SidebarButtonProps {
  icon: ReactNode
  label: string
  active: boolean
  onClick: () => void
}

export function SidebarButton({ icon, label, active, onClick }: SidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="text-sm font-semibold tracking-tight">{label}</span>
    </button>
  )
}

