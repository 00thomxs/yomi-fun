"use client"

import { useRouter } from "next/navigation"
import { LeaderboardView } from "@/components/views/leaderboard-view"

export default function LeaderboardPage() {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return <LeaderboardView onBack={handleBack} />
}

