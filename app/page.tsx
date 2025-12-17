import { PnlReceiptCard } from "@/components/pnl-receipt-card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-8">
      {/* Tactical Grid Background */}
      <div
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10">
        <PnlReceiptCard
          data={{
            pnlPercentage: 420,
            pnlAmount: 2420000,
            event: "Tataki Trend Awards : Expression de l'année",
            sens: "OUI - Doro Party",
            mise: 25000,
            date: "12/12/2024",
          }}
        />
      </div>
    </main>
  )
}
