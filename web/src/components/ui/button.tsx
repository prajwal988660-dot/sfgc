import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold ' +
    'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none ' +
    'disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-card hover:bg-primary-800 hover:shadow-lift',
        gold: 'bg-gold text-gold-foreground shadow-card hover:bg-gold-400 hover:shadow-lift',
        maroon:
          'bg-maroon text-maroon-foreground shadow-card hover:bg-maroon-700 hover:shadow-lift',
        outline:
          'border-2 border-primary/25 bg-transparent text-primary hover:border-primary/60 hover:bg-primary/5 dark:text-primary-200',
        glass:
          'border border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        ghost: 'hover:bg-secondary hover:text-secondary-foreground',
        link: 'text-primary underline-offset-4 hover:underline dark:text-primary-200',
        destructive:
          'bg-destructive text-destructive-foreground shadow-card hover:bg-destructive/90',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 text-xs',
        // 3.25rem — `h-13` is not on Tailwind's default scale, so it emitted
        // nothing and every `size="lg"` button collapsed to text height.
        lg: 'h-[3.25rem] px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the child element (e.g. a Next `<Link>`) instead of a `<button>`. */
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
