import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { colors, radius, shadow, spacing, typography } from '@/theme'

/** The shared building blocks every screen composes from. */

// ------------------------------------------------------------------ screen --

export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  style,
  contentStyle,
  edges = ['top'],
}: {
  children: React.ReactNode
  scroll?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  )

  return (
    <SafeAreaView style={[styles.screen, style]} edges={edges}>
      {body}
    </SafeAreaView>
  )
}

// ------------------------------------------------------------------ button --

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold'

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  small = false,
  style,
}: {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  icon?: keyof typeof Ionicons.glyphMap
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  small?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const isDisabled = disabled || loading
  const palette = BUTTON_PALETTE[variant]

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: palette.bg, borderColor: palette.border },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={palette.fg} /> : null}
          <Text
            style={[
              small ? typography.caption : typography.bodyStrong,
              { color: palette.fg },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  )
}

const BUTTON_PALETTE: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.brand, fg: colors.textOnBrand, border: colors.brand },
  secondary: { bg: colors.brandTint, fg: colors.brand, border: colors.brandTint },
  outline: { bg: 'transparent', fg: colors.brand, border: colors.borderStrong },
  ghost: { bg: 'transparent', fg: colors.brand, border: 'transparent' },
  danger: { bg: colors.danger, fg: '#fff', border: colors.danger },
  gold: { bg: colors.gold, fg: '#231a03', border: colors.gold },
}

// ------------------------------------------------------------------- input --

export function AppInput({
  label,
  error,
  hint,
  style,
  ...props
}: TextInputProps & { label?: string; error?: string | null; hint?: string }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={label}
        style={[styles.input, Boolean(error) && styles.inputError, style]}
        {...props}
      />
      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  )
}

// -------------------------------------------------------------------- card --

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  onPress?: () => void
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
      >
        {children}
      </Pressable>
    )
  }
  return <View style={[styles.card, style]}>{children}</View>
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

// --------------------------------------------------------------------- pill --

export function Pill({
  label,
  tone = 'neutral',
  style,
}: {
  label: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'gold'
  style?: StyleProp<ViewStyle>
}) {
  const palette = PILL_PALETTE[tone]
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.pillText, { color: palette.fg }]}>{label}</Text>
    </View>
  )
}

const PILL_PALETTE = {
  neutral: { bg: colors.surfaceAlt, fg: colors.textMuted },
  success: { bg: colors.successTint, fg: colors.success },
  warning: { bg: colors.warningTint, fg: colors.warning },
  danger: { bg: colors.dangerTint, fg: colors.danger },
  info: { bg: colors.infoTint, fg: colors.info },
  brand: { bg: colors.brandTint, fg: colors.brand },
  gold: { bg: colors.goldTint, fg: '#8a6d13' },
} as const

// ---------------------------------------------------------------- stat tile --

export function StatTile({
  value,
  label,
  tone = 'brand',
  style,
}: {
  value: string
  label: string
  tone?: 'brand' | 'success' | 'warning' | 'danger'
  style?: StyleProp<ViewStyle>
}) {
  const fg = {
    brand: colors.brand,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  }[tone]

  return (
    <View style={[styles.statTile, style]}>
      <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

// ------------------------------------------------------------------- states --

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color={colors.brand} />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  )
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap
  title: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <View style={styles.centerState}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={30} color={colors.brand} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {message ? <Text style={styles.stateText}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <AppButton
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          fullWidth={false}
          small
          style={{ marginTop: spacing.lg }}
        />
      ) : null}
    </View>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <View style={styles.centerState}>
      <View style={[styles.stateIcon, { backgroundColor: colors.dangerTint }]}>
        <Ionicons name="alert-circle-outline" size={30} color={colors.danger} />
      </View>
      <Text style={styles.stateTitle}>Something went wrong</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry ? (
        <AppButton
          label="Try again"
          onPress={onRetry}
          variant="secondary"
          fullWidth={false}
          small
          style={{ marginTop: spacing.lg }}
        />
      ) : null}
    </View>
  )
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{letters}</Text>
    </View>
  )
}

export function KeyValue({
  label,
  value,
  style,
}: {
  label: string
  value: string
  style?: StyleProp<TextStyle>
}) {
  return (
    <View style={styles.keyValue}>
      <Text style={styles.keyValueLabel}>{label}</Text>
      <Text style={[styles.keyValueValue, style]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  )
}

// ------------------------------------------------------------------ styles --

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  buttonSmall: { height: 38, paddingHorizontal: spacing.lg },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.5 },
  fullWidth: { alignSelf: 'stretch' },

  field: { gap: spacing.xs },
  fieldLabel: { ...typography.caption, color: colors.textMuted },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    color: colors.text,
    ...typography.body,
  },
  inputError: { borderColor: colors.danger, backgroundColor: colors.dangerTint },
  fieldError: { ...typography.caption, color: colors.danger },
  fieldHint: { ...typography.caption, color: colors.textFaint },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.heading, color: colors.text },
  sectionAction: { ...typography.caption, color: colors.brand },

  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  pillText: { ...typography.tiny, textTransform: 'uppercase' },

  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  statValue: { ...typography.title },
  statLabel: { ...typography.caption, color: colors.textMuted },

  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  stateIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandTint,
    marginBottom: spacing.sm,
  },
  stateTitle: { ...typography.subheading, color: colors.text, textAlign: 'center' },
  stateText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  divider: { height: 1, backgroundColor: colors.border },

  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  avatarText: { color: colors.textOnBrand, fontWeight: '700' },

  keyValue: { gap: 2 },
  keyValueLabel: { ...typography.tiny, color: colors.textFaint, textTransform: 'uppercase' },
  keyValueValue: { ...typography.bodyStrong, color: colors.text },
})
