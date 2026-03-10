import { cn } from "@/lib/utils"

interface LumeMarkProps {
  size?: number
  animate?: boolean
  className?: string
}

export function LumeMark({ size = 40, animate = false, className }: LumeMarkProps) {
  const midInset = Math.round(size * 0.12)
  const coreInset = Math.round(size * 0.25)
  const sparkInset = Math.round(size * 0.39)
  const glowSize = Math.round(size * 0.25)
  const glowSpread = Math.round(size * 0.5)

  return (
    <div
      className={cn("relative flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {/* Outer ring — faint conic halo */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 200deg, #F7C94810, #F5A62328, #E8724A1C, #F7C94810)",
          animation: animate ? `lume-spin-slow 12s linear infinite` : undefined,
        }}
      />
      {/* Middle ring */}
      <div
        className="absolute rounded-full"
        style={{
          inset: midInset,
          background: "conic-gradient(from 160deg, #F7C94820, #F5A62348, #E8724A35, #F7C94820)",
          animation: animate ? `lume-spin-slow 8s linear infinite reverse` : undefined,
        }}
      />
      {/* Core glow */}
      <div
        className="absolute rounded-full"
        style={{
          inset: coreInset,
          background: "radial-gradient(ellipse at 38% 32%, #F7C948, #F5A623 50%, #E8724A)",
          boxShadow: `0 0 ${glowSize}px #F5A62355, 0 0 ${glowSpread}px #F5A62325`,
        }}
      />
      {/* Spark highlight */}
      <div
        className="absolute rounded-full"
        style={{
          inset: sparkInset,
          background: "radial-gradient(ellipse at 35% 30%, #fff 0%, #FFF3DC 55%, transparent 78%)",
          opacity: 0.92,
        }}
      />
    </div>
  )
}

interface LumeLogoProps {
  size?: "sm" | "md" | "lg"
  variant?: "dark" | "light" | "gradient"
  animate?: boolean
  className?: string
}

const markSizes = { sm: 24, md: 32, lg: 44 }
const textSizes = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" }

const wordmarkStyles: Record<string, React.CSSProperties> = {
  gradient: {
    background: "linear-gradient(135deg, #F7C948 0%, #F5A623 50%, #E8724A 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  dark: { color: "#ffffff" },
  light: { color: "#1A1410" },
}

export function LumeLogo({
  size = "md",
  variant = "gradient",
  animate = false,
  className,
}: LumeLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LumeMark size={markSizes[size]} animate={animate} />
      <span
        className={cn("font-serif leading-none tracking-[-0.01em]", textSizes[size])}
        style={wordmarkStyles[variant]}
      >
        Lume
      </span>
    </div>
  )
}
