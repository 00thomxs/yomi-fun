"use client"

import { useUser } from "@/contexts/user-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { YomiLogo } from "@/components/ui/yomi-logo"
import { 
  LayoutDashboard, 
  PlusCircle, 
  Settings, 
  LogOut,
  ShoppingBag,
  Trophy,
  Award,
  CreditCard,
  Users,
  Mail,
} from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, isAuthenticated, signOut } = useUser()
  const router = useRouter()
  const pathname = usePathname()

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
    { name: "Créer un marché", href: "/admin/create", icon: PlusCircle },
    { name: "Utilisateurs", href: "/admin/users", icon: Users },
    { name: "Emails", href: "/admin/emails", icon: Mail },
    { name: "Saisons", href: "/admin/seasons", icon: Trophy },
    { name: "Badges", href: "/admin/badges/award-existing", icon: Award },
    { name: "Cartes profil", href: "/admin/cards", icon: CreditCard },
    { name: "Cosmétiques", href: "/admin/shop", icon: ShoppingBag },
    { name: "Paramètres", href: "/admin/settings", icon: Settings },
  ]

  // Longest matching prefix wins, so /admin only lights up on the dashboard itself
  const activeHref = navigation
    .map((n) => n.href)
    .filter((href) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)))
    .sort((a, b) => b.length - a.length)[0]

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-background flex flex-col fixed h-full">
        <div className="h-16 px-5 flex items-center gap-2 border-b border-border">
          <Link href="/" aria-label="Retour au site">
            <YomiLogo />
          </Link>
          <span className="px-1.5 py-0.5 rounded border border-border text-[11px] font-medium text-muted-foreground">Admin</span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Navigation admin">
          {navigation.map((item) => {
            const active = item.href === activeHref
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-3 h-9 px-3 text-sm font-medium rounded-md transition-colors ${
                  active
                    ? "bg-surface-hover text-foreground before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <item.icon className="w-4 h-4" aria-hidden />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <img src={user?.avatar || "/images/default-avatar.svg"} alt="" className="w-8 h-8 rounded object-cover bg-muted" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">Administrateur</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 h-9 px-3 text-sm font-medium text-muted-foreground hover:text-no hover:bg-surface-hover rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-ui flex-1 ml-60 px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
