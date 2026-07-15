import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[3px] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[color,background-color,opacity,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-foreground hover:bg-accent/90 active:opacity-90',
        outline:
          'border-border bg-transparent text-foreground hover:bg-secondary/60 aria-expanded:bg-secondary',
        secondary:
          'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary',
        ghost:
          'text-muted-foreground hover:bg-secondary/50 hover:text-foreground aria-expanded:bg-secondary/50',
        destructive:
          'bg-red-600 text-white hover:bg-red-500 active:opacity-90',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 min-h-12 gap-2 px-4',
        xs: "h-8 min-h-8 gap-1 rounded-[3px] px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 min-h-10 gap-1.5 rounded-[3px] px-3 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-12 min-h-12 gap-2 px-5',
        icon: 'size-12 min-h-12 min-w-12',
        'icon-xs': "size-8 min-h-8 min-w-8 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-10 min-h-10 min-w-10',
        'icon-lg': 'size-12 min-h-12 min-w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
