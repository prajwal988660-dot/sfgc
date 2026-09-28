'use client'

import * as React from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
}

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: Direction
  delay?: number
  /** Fraction of the element that must be visible before it animates. */
  amount?: number
  as?: 'div' | 'section' | 'li' | 'article' | 'header'
}

/**
 * Scroll-triggered entrance. Animates once, and collapses to a plain fade
 * (no movement) when the visitor has asked for reduced motion.
 */
export function Reveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  amount = 0.25,
  as = 'div',
  ...props
}: RevealProps) {
  const reduceMotion = useReducedMotion()
  const offset = reduceMotion ? OFFSET.none : OFFSET[direction]
  const MotionTag = motion[as]

  return (
    <MotionTag
      className={cn(className)}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{
        duration: reduceMotion ? 0.2 : 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </MotionTag>
  )
}

/** Parent that staggers its `RevealItem` children. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  amount = 0.15,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { stagger?: number; amount?: number }) {
  const variants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger } },
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={variants}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const reduceMotion = useReducedMotion()
  const variants: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.2 : 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <motion.div className={cn(className)} variants={variants} {...(props as Record<string, unknown>)}>
      {children}
    </motion.div>
  )
}
