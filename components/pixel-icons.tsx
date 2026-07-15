import { cn } from '@/lib/utils'

interface PixelIconProps {
  className?: string
}

/**
 * PixelFolderIcon - Subtle pixelated grid representation of a folder
 */
export function PixelFolderIcon({ className }: PixelIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-10 text-accent/75 fill-current shrink-0', className)}
      aria-hidden="true"
    >
      {/* Folder Tab top left */}
      <rect x="1" y="2" width="4" height="2" />
      <rect x="2" y="3" width="2" height="1" fill="#0f1115" />
      {/* Folder Main Body */}
      <rect x="1" y="4" width="14" height="10" />
      {/* Cutout details for visual depth */}
      <rect x="2" y="5" width="12" height="8" fill="#171a21" />
      <rect x="3" y="7" width="5" height="1" className="text-accent/20 fill-current" />
      <rect x="3" y="9" width="3" height="1" className="text-accent/20 fill-current" />
    </svg>
  )
}

/**
 * PixelDocIcon - Subtle pixelated representation of a page/document
 */
export function PixelDocIcon({ className }: PixelIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-10 text-accent/75 fill-current shrink-0', className)}
      aria-hidden="true"
    >
      {/* Sheet Base */}
      <rect x="2" y="1" width="12" height="14" />
      {/* Cutout to give paper body */}
      <rect x="3" y="2" width="10" height="12" fill="#171a21" />
      {/* Dog ear fold top-right */}
      <rect x="10" y="2" width="3" height="3" fill="#1c202a" />
      <rect x="11" y="2" width="2" height="2" className="text-accent/40 fill-current" />
      {/* Decorative text lines */}
      <rect x="5" y="5" width="6" height="1" className="text-accent/20 fill-current" />
      <rect x="5" y="7" width="6" height="1" className="text-accent/20 fill-current" />
      <rect x="5" y="9" width="4" height="1" className="text-accent/20 fill-current" />
    </svg>
  )
}

/**
 * PixelCrabIcon - PDF-Crab mascot logo using modern retro-pixel blocks
 */
export function PixelCrabIcon({ className }: PixelIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-12 text-accent fill-current shrink-0', className)}
      aria-hidden="true"
    >
      {/* Eyes */}
      <rect x="4" y="2" width="2" height="2" />
      <rect x="5" y="3" width="1" height="1" fill="#0f1115" />
      <rect x="10" y="2" width="2" height="2" />
      <rect x="10" y="3" width="1" height="1" fill="#0f1115" />
      
      {/* Eye stalks */}
      <rect x="5" y="4" width="1" height="1" />
      <rect x="10" y="4" width="1" height="1" />
      
      {/* Main Body block */}
      <rect x="3" y="5" width="10" height="6" />
      <rect x="5" y="7" width="6" height="2" fill="#1c202a" className="opacity-40" />
      
      {/* Left Claw */}
      <rect x="1" y="3" width="2" height="4" />
      <rect x="1" y="4" width="1" height="2" fill="#0f1115" />
      
      {/* Right Claw */}
      <rect x="13" y="3" width="2" height="4" />
      <rect x="14" y="4" width="1" height="2" fill="#0f1115" />
      
      {/* Left/Right leg stalks */}
      <rect x="2" y="11" width="2" height="2" />
      <rect x="12" y="11" width="2" height="2" />
      <rect x="5" y="11" width="2" height="2" />
      <rect x="9" y="11" width="2" height="2" />
    </svg>
  )
}
