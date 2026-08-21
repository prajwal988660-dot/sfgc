import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import { AppButton, AppInput, Card, Screen } from '@/components/ui'
import { apiBaseUrl } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { colors, radius, shadow, spacing, typography } from '@/theme'

/**
 * Rendered in place of the whole stack while signed out, so it takes no
 * navigation props — a successful sign-in swaps the navigator underneath it.
 */
export default function LoginScreen() {
  const { signIn, signingIn, error, clearError } = useAuth()
  const insets = useSafeAreaInsets()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [identifierError, setIdentifierError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const validate = (): boolean => {
    const trimmed = identifier.trim()
    const nextIdentifier = trimmed
      ? null
      : 'Enter your register number or college email.'
    const nextPassword = password ? null : 'Enter your password.'

    setIdentifierError(nextIdentifier)
    setPasswordError(nextPassword)
    return !nextIdentifier && !nextPassword
  }

  const handleSubmit = () => {
    if (signingIn) return
    clearError()
    if (!validate()) return
    // The auth store owns the request; it never throws, it sets `error`.
    void signIn(identifier, password)
  }

  return (
    <Screen scroll={false} edges={[]} contentStyle={styles.screenContent}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[colors.brand, colors.brandDark] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + spacing.xxl }]}
          >
            <View style={styles.lockup}>
              <View style={styles.crest}>
                <Text style={styles.crestText}>SFGC</Text>
              </View>
              <View style={styles.lockupText}>
                <Text style={styles.collegeName}>Seshadripuram</Text>
                <Text style={styles.collegeName}>First Grade College</Text>
                <Text style={styles.collegePlace}>Yelahanka, Bengaluru</Text>
              </View>
            </View>
            <Text style={styles.portalTitle}>Student Portal</Text>
            <Text style={styles.portalSubtitle}>
              Attendance, marks, events and college notices — in one place.
            </Text>
          </LinearGradient>

          <View style={styles.body}>
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>Sign in</Text>

              {error ? (
                <View style={styles.banner}>
                  <Ionicons
                    name="alert-circle"
                    size={18}
                    color={colors.danger}
                    style={styles.bannerIcon}
                  />
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

              <AppInput
                label="Student ID, register number or email"
                placeholder="BCA25001, SFGC101 or you@sfgc.ac.in"
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

              <View style={styles.passwordField}>
                <AppInput
                  label="Password"
                  placeholder="Your password"
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
                  editable={!signingIn}
                  onSubmitEditing={handleSubmit}
                  style={styles.passwordInput}
                />
                <Pressable
                  onPress={() => setShowPassword((visible) => !visible)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  accessibilityState={{ selected: showPassword }}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>

              <AppButton
                label="Sign in"
                onPress={handleSubmit}
                icon="log-in-outline"
                loading={signingIn}
                style={styles.submit}
              />
            </Card>

            <View style={styles.help}>
              <Ionicons name="card-outline" size={16} color={colors.textFaint} />
              <Text style={styles.helpText}>
                Your register number is printed on your college ID card. If your
                password does not work, ask the college office to reset it.
              </Text>
            </View>

            {__DEV__ ? <Text style={styles.devText}>API · {apiBaseUrl}</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

/**
 * The eye toggle is absolutely positioned over AppInput's TextInput: the label
 * block above it is one caption line (13pt ≈ 18) plus the field's 4pt gap, and
 * the 44pt target is centred inside the 50pt input.
 */
const LABEL_BLOCK = 18 + spacing.xs
const INPUT_HEIGHT = 50
const EYE_SIZE = 44

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenContent: { padding: 0 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxxl },

  header: {
    paddingHorizontal: spacing.xl,
    // Leaves room for the card that floats up over the gradient.
    paddingBottom: spacing.xxxl + spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    gap: spacing.sm,
  },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  crest: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  crestText: { ...typography.caption, color: colors.gold, letterSpacing: 1 },
  lockupText: { flex: 1 },
  collegeName: { ...typography.subheading, color: colors.textOnBrand },
  collegePlace: { ...typography.caption, color: 'rgba(255, 255, 255, 0.72)' },
  portalTitle: { ...typography.display, color: colors.textOnBrand, marginTop: spacing.lg },
  portalSubtitle: { ...typography.body, color: 'rgba(255, 255, 255, 0.82)' },

  body: {
    paddingHorizontal: spacing.lg,
    marginTop: -(spacing.xxxl),
    gap: spacing.lg,
  },
  formCard: { padding: spacing.xl, gap: spacing.lg, ...shadow.raised },
  formTitle: { ...typography.title, color: colors.text },

  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerTint,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  bannerIcon: { marginTop: 1 },
  bannerText: { ...typography.caption, color: colors.danger, flex: 1 },
  bannerClose: { marginTop: -2 },

  passwordField: { position: 'relative' },
  passwordInput: { paddingRight: EYE_SIZE + spacing.xs },
  eyeButton: {
    position: 'absolute',
    right: spacing.xs,
    top: LABEL_BLOCK + (INPUT_HEIGHT - EYE_SIZE) / 2,
    width: EYE_SIZE,
    height: EYE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submit: { marginTop: spacing.xs },

  help: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  helpText: { ...typography.caption, color: colors.textMuted, flex: 1, lineHeight: 19 },
  devText: {
    ...typography.tiny,
    color: colors.textFaint,
    textAlign: 'center',
    letterSpacing: 0,
  },
})
