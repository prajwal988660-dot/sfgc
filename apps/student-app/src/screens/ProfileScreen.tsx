import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import {
  AppButton,
  Avatar,
  Card,
  Divider,
  ErrorState,
  KeyValue,
  Pill,
  Screen,
  SectionTitle,
} from '@/components/ui'
import { apiBaseUrl } from '@/lib/api'
import { registerForPushNotifications } from '@/lib/notifications'
import { useAuth } from '@/store/auth'
import { colors, radius, spacing, typography } from '@/theme'
import type { RootStackParamList } from '@/navigation/types'
import { formatDate, studentSubtitle } from '@sfgc/shared'

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>

const NOT_SET = '—'

const appVersion = Constants.expoConfig?.version ?? 'unknown'

// The signed-in stack swaps itself out on sign-out, so nothing here navigates.
export default function ProfileScreen(_props: Props) {
  const { user, refresh, signOut } = useAuth()

  const [refreshing, setRefreshing] = useState(false)
  const [enablingPush, setEnablingPush] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refresh()
    if (mounted.current) setRefreshing(false)
  }, [refresh])

  const handleEnablePush = useCallback(async () => {
    setEnablingPush(true)
    // Never throws — it returns null whenever push is unavailable.
    const token = await registerForPushNotifications()
    if (!mounted.current) return
    setEnablingPush(false)

    if (token) {
      Alert.alert(
        'Notifications are on',
        'This device is registered. New college notices will arrive as push notifications.',
      )
    } else {
      Alert.alert(
        'Notifications are off',
        'This device could not be registered. Allow notifications for SFGC Student in your ' +
          'phone settings, then try again. Push notifications also need a real device — they ' +
          'do not work on a simulator.',
      )
    }
  }, [])

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign out', 'You will need your password to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void signOut()
        },
      },
    ])
  }, [signOut])

  // The Profile route only exists inside the signed-in stack, so a missing user
  // means the session was dropped mid-screen rather than an empty result.
  if (!user) {
    return (
      <Screen>
        <ErrorState
          message="Your session has ended. Sign in again to see your profile."
          onRetry={() => {
            void refresh()
          }}
        />
      </Screen>
    )
  }

  const subtitle = studentSubtitle(user)

  return (
    <Screen refreshing={refreshing} onRefresh={() => void onRefresh()} edges={[]}>
      <Card style={styles.headerCard}>
        <Avatar name={user.name} size={72} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.registerNo}>
            {user.registerNo ?? 'Register number not on file'}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Pill label="Student" tone="brand" />
      </Card>

      <View style={styles.section}>
        <SectionTitle title="Academic" />
        <Card style={styles.detailCard}>
          <KeyValue label="Programme" value={user.program ?? NOT_SET} />
          <Divider />
          <KeyValue
            label="Semester"
            value={user.semester ? `Semester ${user.semester}` : NOT_SET}
          />
          <Divider />
          <KeyValue
            label="Section"
            value={user.section ? `Section ${user.section}` : NOT_SET}
          />
          <Divider />
          <KeyValue label="Department" value={user.department ?? NOT_SET} />
          <Divider />
          <KeyValue
            label="Admission year"
            value={user.admissionYear ? String(user.admissionYear) : NOT_SET}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Contact" />
        <Card style={styles.detailCard}>
          <KeyValue label="Email" value={user.email} />
          <Divider />
          <KeyValue label="Phone" value={user.phone ?? NOT_SET} />
          <Divider />
          <KeyValue label="Member since" value={formatDate(user.createdAt)} />
          <Text style={styles.note}>
            The college office maintains these details. Visit them to correct anything
            that is wrong.
          </Text>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Notifications" />
        <Card style={styles.detailCard}>
          <View style={styles.pushRow}>
            <View style={styles.pushIcon}>
              <Ionicons name="megaphone-outline" size={20} color={colors.brand} />
            </View>
            <View style={styles.pushText}>
              <Text style={styles.pushTitle}>Notices on your phone</Text>
              <Text style={styles.pushBody}>
                College notices are delivered as push notifications, so you see exam
                dates and circulars without opening the app. If you declined the
                permission prompt, allow it here.
              </Text>
            </View>
          </View>
          <AppButton
            label="Enable notifications"
            onPress={() => void handleEnablePush()}
            variant="secondary"
            icon="notifications-outline"
            loading={enablingPush}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle title="About" />
        <Card style={styles.detailCard}>
          <KeyValue label="App version" value={appVersion} />
          {__DEV__ ? (
            <>
              <Divider />
              <KeyValue label="API base URL" value={apiBaseUrl} />
            </>
          ) : null}
        </Card>
      </View>

      <AppButton
        label="Sign out"
        onPress={handleSignOut}
        variant="danger"
        icon="log-out-outline"
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  headerText: { flex: 1, gap: 2 },
  name: { ...typography.title, color: colors.text },
  registerNo: { ...typography.bodyStrong, color: colors.brand },
  subtitle: { ...typography.caption, color: colors.textMuted },

  section: { gap: spacing.sm },
  detailCard: { gap: spacing.md },

  note: { ...typography.caption, color: colors.textFaint, lineHeight: 18 },

  pushRow: { flexDirection: 'row', gap: spacing.md },
  pushIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandTint,
  },
  pushText: { flex: 1, gap: spacing.xs },
  pushTitle: { ...typography.subheading, color: colors.text },
  pushBody: { ...typography.caption, color: colors.textMuted, lineHeight: 19 },
})
