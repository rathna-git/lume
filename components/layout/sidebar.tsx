"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Settings } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { LumeLogo } from "@/components/logo"
import { cn } from "@/lib/utils"

const navItems = [
    { label: "Workspaces", href: "/workspaces", icon: LayoutGrid },
    { label: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-56 flex flex-col border-r border-border bg-sidebar shrink-0">
            {/* Logo */}
            <div className="px-5 h-14 flex items-center border-b border-border">
                <LumeLogo size="sm" variant="light" />
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-3 space-y-0.5">
                {navItems.map(({ label, href, icon: Icon }) => {
                    const active = pathname.startsWith(href)
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                active
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Icon size={16} />
                            {label}
                        </Link>
                    )
                })}
            </nav>

            {/* User */}
            <div className="px-5 py-4 border-t border-border">
                <UserButton afterSignOutUrl="/" />
            </div>
        </aside>
    )
}
