interface CurrencySymbolProps {
  className?: string
}

export function CurrencySymbol({ className = "" }: CurrencySymbolProps) {
  return <span className={`font-mono font-bold ${className}`}>Ƶ</span>
}

