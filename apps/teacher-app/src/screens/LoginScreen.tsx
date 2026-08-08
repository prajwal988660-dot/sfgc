import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import { AppButton, AppInput, Card, Screen } from '@/components/ui'
import { apiBaseUrl } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { colors, radius, shadow, spacing, typography } from '@/theme'

/**
 * `as const` keeps this a two-element tuple — expo-linear-gradient types
 * `colors` as `readonly [string, string, ...string[]]`, which a plain
 * `string[]` does not satisfy.
 */
const HERO_GRADIENT = [colors.brand, colors.brandDark] as const

export default function LoginScreen() {
  const { signIn, signingIn, error, clearError } = useAuth()
  const insets = useSafeAreaInsets()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [identifierError, setIdentifierError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const submit = () => {
    const trimmed = identifier.trim()
    const nextIdentifierError = trimmed ? null : 'Enter your employee ID or email.'
    const nextPasswordError = password ? null : 'Enter your password.'

    setIdentifierError(nextIdentifierError)
    setPasswordError(nextPasswordError)
    if (nextIdentifierError || nextPasswordError) return

    // The auth store owns `signingIn` and `error`, so nothing to await here.
    void signIn(trimmed, password)
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen scroll edges={[]} contentStyle={styles.content}>
        <LinearGradient
          colors={HERO_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="school" size={30} color={colors.textOnBrand} />
          </View>
          <Text style={styles.wordmark} accessibilityRole="header">
            SFGC
          </Text>
          <Text style={styles.heroSubtitle}>Teacher Portal</Text>
        </LinearGradient>

        <View style={styles.body}>
          <Card style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardHeadIcon}>
                <Ionicons name="lock-closed" size={20} color={colors.brand} />
              </View>
              <View style={styles.fill}>
                <Text style={styles.cardTitle}>Sign in</Text>
                <Text style={styles.cardSubtitle}>Use your college staff account</Text>
              </View>
            </View>

            {error ? (
              <View style={styles.banner}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.bannerText}>{error}</Text>
                <Pressable
                  onPress={clearError}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss error"
                  hitSlop={12}
                  style={styles.bannerClose}
                >
                  <Ionicons name="close" size={18} color={colors.danger} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.form}>
              <AppInput
                label="Employee ID or email"
                placeholder="T01 or you@sfgc.ac.in"
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text)
                  if (identifierError) setIdentifierError(null)
                }}
                error={identifierError}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                keyboardType="email-address"
                returnKeyType="next"
                editable={!signingIn}
              />

              {/*
                The eye toggle is absolutely positioned over the input, so this
                field renders its own label — AppInput's label would shift the
                input down by an amount that depends on the platform's line
                height, and the overlay has to line up exactly.
              */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.passwordWrap}>
                  <AppInput
                    placeholder="••••••••"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text)
                      if (passwordError) setPasswordError(null)
                    }}
                    error={passwordError}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={submit}
                    editable={!signingIn}
                    accessibilityLabel="Password"
                    style={styles.passwordInput}
                  />
                  <Pressable
                    onPress={() => setShowPassword((visible) => !visible)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    accessibilityState={{ selected: showPassword }}
                    style={styles.eyeToggle}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            <AppButton
              label="Sign in"
              onPress={submit}
              icon="log-in-outline"
              loading={signingIn}
            />
          </Card>

          <Text style={styles.help}>
            Trouble signing in? Contact the college office to have your employee ID
            confirmed or your password reset.
          </Text>

          {__DEV__ ? <Text style={styles.dev}>API · {apiBaseUrl}</Text> : null}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // Screen's default padding would inset the gradient band from the edges.
  content: { padding: 0, paddingBottom: spacing.xxxl, gap: 0 },

  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  wordmark: {
    ...typography.display,
    fontSize: 38,
    letterSpacing: 6,
    color: colors.textOnBrand,
  },
  heroSubtitle: {
    ...typography.caption,
    marginTop: spacing.sm,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textOnBrand,
    opacity: 0.82,
  },

  // Lifts the card so it floats over the bottom of the gradient band.
  body: {
    marginTop: -(spacing.xxxl + spacing.sm),
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  card: { gap: spacing.lg, ...shadow.raised },

  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardHeadIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandTint,
  },
  cardTitle: { ...typography.heading, color: colors.text },
  cardSubtitle: { ...typography.caption, color: colors.textMuted },

  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerTint,
  },
  bannerText: { ...typography.caption, flex: 1, color: colors.danger },
  bannerClose: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },

  form: { gap: spacing.md },
  field: { gap: spacing.xs },
  fieldLabel: { ...typography.caption, color: colors.textMuted },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeToggle: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 52,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  help: {
    ...typography.caption,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
    lineHeight: 20,
    color: colors.textMuted,
  },
  dev: { ...typography.tiny, textAlign: 'center', color: colors.textFaint },
})
