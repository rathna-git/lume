"use client"

import { useEffect, useRef } from "react"

export function ParallaxHills() {
  const backRef = useRef<SVGPathElement>(null)
  const midRef = useRef<SVGPathElement>(null)
  const frontRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        if (backRef.current) backRef.current.style.transform = `translateY(${y * 0.02}px)`
        if (midRef.current) midRef.current.style.transform = `translateY(${y * 0.05}px)`
        if (frontRef.current) frontRef.current.style.transform = `translateY(${y * 0.08}px)`
        ticking = false
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <svg
      className="absolute bottom-0 left-0 w-full h-[60vh] pointer-events-none z-6"
      viewBox="0 0 1440 600"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Back hill — warm olive-sage, catches sunset */}
        <linearGradient id="hillBack" gradientUnits="userSpaceOnUse" x1="0" y1="128" x2="0" y2="380">
          <stop offset="0%" stopColor="#96A862" />
          <stop offset="4%" stopColor="#7C8E48" />
          <stop offset="12%" stopColor="#607830" />
          <stop offset="30%" stopColor="#3A4E1E" />
          <stop offset="60%" stopColor="#1E2C10" />
          <stop offset="100%" stopColor="#0C1208" />
        </linearGradient>

        {/* Mid hill — muted forest green */}
        <linearGradient id="hillMid" gradientUnits="userSpaceOnUse" x1="0" y1="260" x2="0" y2="480">
          <stop offset="0%" stopColor="#5E7A38" />
          <stop offset="4%" stopColor="#486028" />
          <stop offset="12%" stopColor="#30421A" />
          <stop offset="30%" stopColor="#1C2A10" />
          <stop offset="60%" stopColor="#101A0A" />
          <stop offset="100%" stopColor="#080E06" />
        </linearGradient>

        {/* Front hill — dark olive, visible but blends to page bg */}
        <linearGradient id="hillFront" gradientUnits="userSpaceOnUse" x1="0" y1="390" x2="0" y2="520">
          <stop offset="0%" stopColor="#344820" />
          <stop offset="6%" stopColor="#263414" />
          <stop offset="20%" stopColor="#18240E" />
          <stop offset="45%" stopColor="#0E1608" />
          <stop offset="100%" stopColor="#090E09" />
        </linearGradient>
      </defs>

      {/* Back hill — gentle wide rolling, two soft mounds */}
      <path
        ref={backRef}
        d="M-60,230 C120,225 280,190 480,182 C680,174 780,168 920,172 C1060,176 1160,195 1300,188 C1440,181 1500,210 1540,218 L1540,600 L-60,600 Z"
        fill="url(#hillBack)"
      />
      {/* Mid hill — offset from left, gentle slope into rolling mounds */}
      <path
        ref={midRef}
        d="M-60,420 C60,415 140,365 280,330 C420,295 500,280 600,278 C700,276 780,310 900,305 C1020,300 1120,278 1260,285 C1400,292 1480,330 1540,345 L1540,600 L-60,600 Z"
        fill="url(#hillMid)"
      />
      {/* Front hill — lowest, subtle undulation */}
      <path
        ref={frontRef}
        d="M-60,465 C120,460 270,425 490,415 C710,405 890,430 1090,420 C1290,410 1450,442 1540,450 L1540,600 L-60,600 Z"
        fill="url(#hillFront)"
      />
    </svg>
  )
}
