interface YomiLogoProps {
  className?: string
}

export function YomiLogo({ className = "" }: YomiLogoProps) {
  return (
    <div className={`flex items-baseline ${className}`}>
      <span
        className="text-primary font-black text-2xl tracking-tight"
        style={{
          filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.6)) drop-shadow(0 0 20px hsl(var(--primary) / 0.3))",
        }}
      >
        YOMI
      </span>
      <span className="font-mono text-sm text-foreground/80 ml-0.5">.fun</span>
    </div>
  )
}

