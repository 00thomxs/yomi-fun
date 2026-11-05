interface YomiLogoProps {
  className?: string
}

export function YomiLogo({ className = "" }: YomiLogoProps) {
  return (
    <div className={`flex items-baseline ${className}`}>
      <span className="font-logo text-primary font-black text-2xl tracking-tight">YOMI</span>
      <span className="font-mono text-sm text-muted-foreground ml-0.5">.fun</span>
    </div>
  )
}
