export interface CountUpProps {
  value: number
  /** Accepted for compatibility; the figure no longer counts up. */
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  /** Drop thousands separators — a year reads 1930, not 1,930. */
  grouping?: boolean
  className?: string
}

/**
 * Renders a formatted figure. It used to count up from 0 on scroll, which left
 * a statistics band reading "0" until it animated; official figures should be
 * correct on first paint, so the final value is shown directly.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  grouping = true,
  className,
}: CountUpProps) {
  const formatted = value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouping,
  })

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
