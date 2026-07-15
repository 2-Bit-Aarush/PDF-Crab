'use client'

import PixelBlast from '@/components/PixelBlast'

export function PixelBackground({ opacity = 0.22 }: { opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-background"
    >
      <div className="absolute inset-0 transition-opacity duration-300" style={{ opacity }}>
        <PixelBlast
          variant="square"
          pixelSize={3}
          color="#2d8d9c"
          patternScale={1.8}
          patternDensity={0.75}
          pixelSizeJitter={0}
          enableRipples={false}
          speed={0.1}
          edgeFade={0.75}
          transparent
          className=""
          style={{}}
        />
      </div>
    </div>
  )
}
