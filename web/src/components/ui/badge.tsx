import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ' +
    'transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        gold: 'border-gold/30 bg-gold/15 text-gold-700 dark:text-gold-300',
        maroon: 'border-transparent bg-maroon text-maroon-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        // Both carry 12px text, so the pairing has to clear AA at small size:
        // white on emerald-600 is 3.8:1 and white on amber-500 only 2.2:1.
        success: 'border-transparent bg-emerald-700 text-white',
        warning: 'border-transparent bg-amber-400 text-amber-950',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        glass: 'border-white/25 bg-white/15 text-white backdrop-blur-md',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
