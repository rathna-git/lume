import Link from "next/link"
import { ArrowRight, Sparkles, FileText, Zap } from "lucide-react"
import { LumeLogo, LumeMark } from "@/components/logo"

const features = [
  {
    icon: FileText,
    title: "Structured workspaces",
    description:
      "Organize your thinking into clean, focused workspaces. Every project, every idea — in its place.",
  },
  {
    icon: Sparkles,
    title: "AI that understands context",
    description:
      "Generate, summarize, rewrite, and expand. Lume's AI works with your content, not around it.",
  },
  {
    icon: Zap,
    title: "Instant clarity",
    description:
      "Turn rough notes into polished writing. Transform complex sources into sharp, usable knowledge.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0F0C09] text-white">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <LumeLogo size="md" variant="gradient" />
        <nav className="flex items-center gap-6">
          <Link
            href="/sign-in"
            className="text-sm text-white/40 hover:text-white/70 transition-colors font-light tracking-wide"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm px-4 py-2 rounded-full border border-white/10 hover:border-lume-amber/40 hover:bg-lume-amber/5 transition-all font-light tracking-wide"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(ellipse, #F5A62310 0%, transparent 65%)" }}
          />
          <div
            className="absolute top-[30%] left-[65%] w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(ellipse, #E8724A08 0%, transparent 70%)" }}
          />
        </div>

        {/* Mark */}
        <div
          className="mb-8"
          style={{ animation: "lume-float-in 1.2s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          <LumeMark size={96} animate />
        </div>

        {/* Wordmark */}
        <h1
          className="font-serif leading-none tracking-[-0.02em] mb-5"
          style={{
            fontSize: "clamp(4rem, 14vw, 9rem)",
            background: "linear-gradient(135deg, #F7C948 0%, #F5A623 50%, #E8724A 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "lume-float-in 1.2s 0.15s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          Lume
        </h1>

        {/* Label */}
        <p
          className="text-[0.65rem] tracking-[0.25em] uppercase text-white/25 mb-4"
          style={{ animation: "lume-float-in 1.2s 0.25s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          AI Content Workspace
        </p>

        {/* Tagline */}
        <p
          className="font-serif italic text-white/75 mb-12"
          style={{
            fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
            animation: "lume-float-in 1.2s 0.32s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          Think clearly. Write better. Learn faster.
        </p>

        {/* CTAs */}
        <div
          className="flex items-center gap-4"
          style={{ animation: "lume-float-in 1.2s 0.45s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          <Link
            href="/sign-up"
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-lume-ink transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #F7C948, #F5A623, #E8724A)" }}
          >
            Start for free
            <ArrowRight size={14} />
          </Link>
          <Link
            href="#features"
            className="px-6 py-3 rounded-full text-sm font-light text-white/40 border border-white/[0.07] hover:border-white/20 hover:text-white/60 transition-all"
          >
            See how it works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-4xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/4 border border-white/4 rounded-2xl overflow-hidden">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-[#0F0C09] p-8 hover:bg-white/2 transition-colors">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-5"
                style={{ background: "linear-gradient(135deg, #F7C94818, #E8724A12)" }}
              >
                <Icon size={15} className="text-lume-amber" />
              </div>
              <h3 className="font-medium text-white/85 mb-2 text-sm tracking-wide">{title}</h3>
              <p className="text-sm text-white/35 font-light leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/4 px-8 py-8 max-w-6xl mx-auto flex items-center justify-between">
        <LumeLogo size="sm" variant="gradient" />
        <p className="text-[0.65rem] tracking-[0.15em] uppercase text-white/20">
          lumenotes.com
        </p>
      </footer>
    </div>
  )
}
