import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-[4px] border border-transparent font-semibold whitespace-nowrap transition-[color,background-color,opacity,border-color,transform,box-shadow] duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-br from-accent to-primary text-accent-foreground shadow-sm hover:shadow-md hover:from-accent/90 hover:to-primary/90 active:opacity-90',
        outline: 'border-border bg-transparent text-foreground hover:bg-secondary/60 aria-expanded:bg-secondary',
        secondary: 'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:border-border/80 active:bg-secondary',
        ghost: 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground active:bg-secondary',
        destructive: 'bg-gradient-to-br from-destructive to-red-600 text-destructive-foreground shadow-sm hover:shadow-md hover:from-destructive/90 active:opacity-90',
        link: 'text-accent underline-offset-2 hover:underline text-sm font-medium',
        pixel: 'relative border-2 border-foreground bg-background text-foreground px-4 py-2 font-brand text-xs uppercase tracking-wider hover:bg-secondary active:bg-secondary/80 before:absolute before:inset-0 before:border-2 before:border-accent/30 before:-translate-x-0.5 before:-translate-y-0.5 pointer-events-none transition-all duration-180 hover:before:translate-x-0.5 hover:before:translate-y-0.5',
        pixelGhost: 'relative border-2 border-transparent bg-transparent text-foreground px-4 py-2 font-brand text-xs uppercase tracking-wider hover:bg-secondary active:bg-secondary/80 before:absolute before:inset-0 before:border-2 before:border-accent/30 before:-translate-x-0.5 before:-translate-y-0.5 pointer-events-none transition-all duration-180 hover:before:translate-x-0.5 hover:before:translate-y-0.5',
      },
      size: {
        default: 'h-11 min-h-11 px-4 text-sm',
        xs: 'h-8 min-h-8 px-2.5 text-xs gap-1',
        sm: 'h-9 min-h-9 px-3 text-sm gap-1.5',
        lg: 'h-12 min-h-12 px-5 text-base gap-2',
        xl: 'h-14 min-h-14 px-6 text-base gap-2.5',
        icon: 'size-11 min-h-11 min-w-11',
        'icon-sm': 'size-9 min-h-9 min-w-9',
        'icon-lg': 'size-12 min-h-12 min-w-12',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof ButtonPrimitive>,
    VariantProps<typeof buttonVariants> {
  fullWidth?: boolean
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }