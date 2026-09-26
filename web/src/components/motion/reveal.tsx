import * as React from 'react'
import { cn } from '@/lib/utils'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Accepted for compatibility; content no longer animates in. */
  direction?: Direction
  delay?: number
  amount?: number
  as?: 'div' | 'section' | 'li' | 'article' | 'header'
}

/**
 * Formerly a scroll-triggered entrance. Content now renders visible on first
 * paint: an official site should never show an empty band while it waits for
 * an animation, and it keeps print, screenshots and slow devices reliable.
 * The animation props are still accepted so existing call sites need no edits.
 */
export function Reveal({
  children,
  className,
  direction: _direction,
  delay: _delay,
  amount: _amount,
  as: Tag = 'div',
  ...props
}: RevealProps) {
  return (
    <Tag className={cn(className)} {...props}>
      {children}
    </Tag>
  )
}

/** Formerly staggered its children in; now a plain container. */
export function RevealGroup({
  children,
  className,
  stagger: _stagger,
  amount: _amount,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { stagger?: number; amount?: number }) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  )
}

export function RevealItem({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  )
}
