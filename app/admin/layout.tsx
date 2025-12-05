"use client"

import { useUser } from "@/contexts/user-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { YomiLogo } from "@/components/ui/yomi-logo"
import { 
  LayoutDashboard, 
  PlusCircle, 
  Settings, 
  LogOut,
  ShoppingBag,
  Package,
} from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, isAuthenticated, signOut } = useUser()
  const router = useRouter()

  useEffect(() => {
    console.log("Admin Layout Check:", { isLoading, isAuthenticated, role: profile?.role })
    
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log("Redirecting to login...")
        router.push("/login")
      } else if (profile && profile.role !== 'admin') {
        // Only redirect if we HAVE a profile and it's NOT admin
        console.log("Redirecting to home (not admin)...")
        router.push("/")
      }
    }
  }, [isLoading, isAuthenticated, profile, router])

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (profile.role !== 'admin') {
    return null
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Créer un Marché", href: "/admin/create", icon: PlusCircle },
    { name: "Commandes", href: "/admin/orders", icon: Package },
    { name: "Shop Items", href: "/admin/shop", icon: ShoppingBag },
    { name: "Paramètres", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col fixed h-full">
        <div className="p-6">
          <Link href="/" className="block">
            <YomiLogo />
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest mt-1 block">
              Admin Panel
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">Administrateur</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
