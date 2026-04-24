import { SignUp } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SignUpPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="absolute top-6 right-8">
                <ThemeToggle />
            </div>
            <SignUp />
        </div>
    )
}