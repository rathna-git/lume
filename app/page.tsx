import Link from "next/link"
import { ArrowRight, Sparkles, FileText, Zap } from "lucide-react"
import { LumeLogo } from "@/components/logo"

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
    <div className="min-h-screen bg-[#090E09] text-white">
      {/* Hero — full viewport landscape scene */}
      <section
        className="relative w-full h-screen overflow-hidden"
        style={{
          background: "linear-gradient(to bottom, #E8724A 0%, #C9A4BE 30%, #B0A8D4 50%, #6B6E8A 75%, #090E09 100%)",
        }}
      >
        {/* Nav */}
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
          <LumeLogo size="md" variant="dark" />
          <nav className="flex items-center gap-6">
            <Link
              href="/sign-in"
              className="text-sm text-white/50 hover:text-white/80 transition-colors font-light tracking-wide"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm px-4 py-2 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all font-light tracking-wide backdrop-blur-sm"
            >
              Get started
            </Link>
          </nav>
        </header>

        {/* Tagline — floating in the sky */}
        <div className="absolute top-[22%] left-0 right-0 z-10 text-center px-6">
          <p
            className="font-serif italic text-white/75"
            style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)" }}
          >
            Think clearly. Write better. Learn faster.
          </p>
        </div>

        {/* Sun container */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-5"
          style={{ top: "42%", width: "36vh", height: "36vh" }}
        >
          {/* Sun glow */}
          <div
            className="absolute -inset-[40%] rounded-full"
            style={{
              background: "radial-gradient(circle, #F5A62338 0%, #F5A62318 35%, transparent 65%)",
            }}
          />
          {/* Sun disc */}
          <div
            className="w-full h-full rounded-full"
            style={{
              background: "radial-gradient(ellipse at 38% 35%, #F7C948, #F5A623 50%, #E8724A)",
              boxShadow: "0 0 80px #F5A62350, 0 0 160px #F5A62325",
            }}
          />
        </div>

        {/* Hills — stretched SVG, always full width */}
        <svg
          className="absolute bottom-0 left-0 w-full h-[52vh] pointer-events-none z-6"
          viewBox="0 0 1440 500"
          preserveAspectRatio="none"
        >
          {/* Far back hills — subtle depth */}
          <path
            d="M0,200 C100,155 200,130 320,140 C440,150 520,185 660,175 C800,165 880,130 1020,138 C1160,146 1300,175 1440,185 L1440,500 L0,500 Z"
            fill="#1E2B1A"
          />
          {/* Back hills */}
          <path
            d="M0,240 C80,190 180,155 300,165 C420,175 500,220 660,210 C820,200 900,160 1060,168 C1220,176 1360,210 1440,225 L1440,500 L0,500 Z"
            fill="#182315"
          />
          {/* Mid hills — more dramatic curves */}
          <path
            d="M0,300 C60,260 160,225 290,235 C420,245 520,290 680,280 C840,270 940,230 1100,238 C1260,246 1380,275 1440,290 L1440,500 L0,500 Z"
            fill="#111A0E"
          />
          {/* Front hills */}
          <path
            d="M0,380 C90,345 210,315 370,325 C530,335 640,370 810,360 C980,350 1100,320 1270,328 C1370,333 1420,350 1440,360 L1440,500 L0,500 Z"
            fill="#090E09"
          />
        </svg>

        {/* CTA — below the hills, on the dark ground */}
        <div className="absolute bottom-[4%] left-0 right-0 z-10 flex flex-col items-center gap-2 px-6">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 text-base font-light text-white/70 hover:text-white/90 transition-colors tracking-wide"
          >
            Start for free <ArrowRight size={14} className="mt-px" />
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
