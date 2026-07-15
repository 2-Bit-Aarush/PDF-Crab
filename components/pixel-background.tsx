'use client'

import PixelBlast from '@/components/PixelBlast'

export function PixelBackground({ opacity = 0.25 }: { opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-background"
    >
      <div className="absolute inset-0 transition-opacity duration-300" style={{ opacity }}>
        <PixelBlast
          variant="square"
          pixelSize={10}
          color="#2d8d9c"
          patternScale={1.5}
          patternDensity={1.35}
          pixelSizeJitter={0}
          enableRipples={false}
          speed={0.5}
          edgeFade={0.4}
          transparent
          className=""
          style={{}}
        />
      </div>
    </div>
  )
}
