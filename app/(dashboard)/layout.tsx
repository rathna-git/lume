import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { userId } = await auth()
    if (!userId) redirect("/sign-in")

    const clerkUser = await currentUser()
    if (!clerkUser) redirect("/sign-in")

    // Bootstrap: upsert DB user on first request, keep in sync on subsequent ones
    await prisma.user.upsert({
        where: { clerkId: userId },
        update: {
            email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
            name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null,
            imageUrl: clerkUser.imageUrl ?? null,
        },
        create: {
            clerkId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
            name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null,
            imageUrl: clerkUser.imageUrl ?? null,
        },
    })

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
