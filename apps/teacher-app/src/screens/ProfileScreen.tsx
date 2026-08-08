import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

import {
  AppButton,
  Avatar,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  KeyValue,
  LoadingState,
  Pill,
  Screen,
  SectionTitle,
  StatTile,
} from '@/components/ui'
import { api, apiBaseUrl, errorMessage } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { colors, spacing, typography } from '@/theme'
import type { MainTabParamList } from '@/navigation/types'

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>

const APP_VERSION = Constants.expoConfig?.version ?? 'unknown'

export default function ProfileScreen({ navigation }: Props) {
  const { user, refresh, signOut } = useAuth()

  const [subjectCount, setSubjectCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const loadSubjectCount = useCallback(async () => {
    try {
      const subjects = await api.subjects.list()
      if (!mountedRef.current) return
      setSubjectCount(subjects.length)
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      setError(errorMessage(err))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await loadSubjectCount()
      if (!cancelled && mountedRef.current) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [loadSubjectCount])

  const retry = useCallback(() => {
    setLoading(true)
    setError(null)
    void (async () => {
      await loadSubjectCount()
      if (mountedRef.current) setLoading(false)
    })()
  }, [loadSubjectCount])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([refresh(), loadSubjectCount()])
    } finally {
      if (mountedRef.current) setRefreshing(false)
    }
  }, [loadSubjectCount, refresh])

  const confirmSignOut = useCallback(() => {
    Alert.alert(
      'Sign out?',
      'You will need your employee ID and password to sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            void signOut()
          },
        },
      ],
    )
  }, [signOut])

  // The tab only mounts behind an authenticated session, but `user` is
  // nullable while the store re-validates the token against the server.
  if (!user || loading) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Loading your profile…" />
      </Screen>
    )
  }

  if (error) {
    return (
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <ErrorState message={error} onRetry={retry} />
      </Screen>
    )
  }

  const roleLabel = user.role === 'ADMIN' ? 'Administrator' : 'Teacher'

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Card style={styles.headerCard}>
        <View style={styles.identity}>
          <Avatar name={user.name} size={64} />
          <View style={styles.identityText}>
            <Text style={styles.name} numberOfLines={2}>
              {user.name}
            </Text>
            <Text style={styles.designation} numberOfLines={1}>
              {user.designation ?? 'Faculty'}
            </Text>
            <Pill
              label={roleLabel}
              tone={user.role === 'ADMIN' ? 'gold' : 'brand'}
              style={styles.rolePill}
            />
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.rows}>
          <KeyValue label="Designation" value={user.designation ?? 'Not set'} />
          <KeyValue label="Department" value={user.department ?? 'Not set'} />
          <KeyValue label="Employee ID" value={user.employeeId ?? 'Not set'} />
        </View>
      </Card>

      <View style={styles.section}>
        <SectionTitle title="Account" />
        <Card>
          <View style={styles.rows}>
            <View style={styles.iconRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textFaint} />
              <View style={styles.rowBody}>
                <KeyValue label="Email" value={user.email} />
              </View>
            </View>
            <Divider />
            <View style={styles.iconRow}>
              <Ionicons name="call-outline" size={18} color={colors.textFaint} />
              <View style={styles.rowBody}>
                <KeyValue label="Phone" value={user.phone ?? 'Not added'} />
              </View>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle
          title="Teaching"
          action="View classes"
          onAction={() => navigation.navigate('Classes')}
        />
        {subjectCount === 0 ? (
          <Card>
            <EmptyState
              icon="library-outline"
              title="No classes assigned"
              message="Once the college office assigns you a subject it will appear here and in My Classes."
            />
          </Card>
        ) : (
          <View style={styles.statRow}>
            <StatTile
              value={String(subjectCount ?? 0)}
              label={subjectCount === 1 ? 'Subject taught' : 'Subjects taught'}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionTitle title="About" />
        <Card>
          <View style={styles.rows}>
            <View style={styles.iconRow}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.textFaint}
              />
              <View style={styles.rowBody}>
                <KeyValue label="App version" value={APP_VERSION} />
              </View>
            </View>
            {__DEV__ ? (
              <>
                <Divider />
                <View style={styles.iconRow}>
                  <Ionicons name="server-outline" size={18} color={colors.textFaint} />
                  <View style={styles.rowBody}>
                    <KeyValue label="API base URL" value={apiBaseUrl} />
                  </View>
                </View>
              </>
            ) : null}
          </View>
        </Card>
      </View>

      <AppButton
        label="Sign out"
        onPress={confirmSignOut}
        variant="danger"
        icon="log-out-outline"
        style={styles.signOut}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  headerCard: { gap: spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  identityText: { flex: 1, gap: 2 },
  name: { ...typography.title, color: colors.text },
  designation: { ...typography.caption, color: colors.textMuted },
  rolePill: { marginTop: spacing.xs },

  divider: { marginHorizontal: -spacing.lg },
  rows: { gap: spacing.md },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowBody: { flex: 1 },

  section: { gap: spacing.md },
  statRow: { flexDirection: 'row', gap: spacing.md },

  signOut: { marginTop: spacing.sm },
})
