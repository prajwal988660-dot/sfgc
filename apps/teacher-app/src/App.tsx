import 'react-native-gesture-handler'

import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import {
  NavigationContainer,
  DefaultTheme,
  useNavigationContainerRef,
  type Theme,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'

import { AuthProvider, useAuth } from '@/store/auth'
import { colors, typography } from '@/theme'
import { readNoticeData } from '@/lib/notifications'
import type { MainTabParamList, RootStackParamList } from '@/navigation/types'

import LoginScreen from '@/screens/LoginScreen'
import DashboardScreen from '@/screens/DashboardScreen'
import ClassesScreen from '@/screens/ClassesScreen'
import MarkAttendanceScreen from '@/screens/MarkAttendanceScreen'
import ClassReportScreen from '@/screens/ClassReportScreen'
import NoticesScreen from '@/screens/NoticesScreen'
import PostNoticeScreen from '@/screens/PostNoticeScreen'
import NoticeDetailScreen from '@/screens/NoticeDetailScreen'
import ProfileScreen from '@/screens/ProfileScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tabs = createBottomTabNavigator<MainTabParamList>()

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.brand,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
}

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  Classes: { active: 'people', inactive: 'people-outline' },
  Notices: { active: 'megaphone', inactive: 'megaphone-outline' },
  Profile: { active: 'person-circle', inactive: 'person-circle-outline' },
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.brand },
        headerTintColor: colors.textOnBrand,
        headerTitleStyle: { ...typography.heading, color: colors.textOnBrand },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name]
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={size ?? 22}
              color={color}
            />
          )
        },
      })}
    >
      <Tabs.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tabs.Screen
        name="Classes"
        component={ClassesScreen}
        options={{ title: 'My Classes' }}
      />
      <Tabs.Screen name="Notices" component={NoticesScreen} options={{ title: 'Notices' }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tabs.Navigator>
  )
}

/**
 * Opens the notice a teacher tapped in a push notification.
 *
 * A cold start resolves the tapped notification long before the stored session
 * has been checked against the server, and `NoticeDetail` only exists inside the
 * signed-in stack. So the id is queued and consumed once the session has settled
 * and a navigator is mounted — a fixed delay would fire into an empty container
 * and drop the link silently.
 */
function useNoticeDeepLinks(
  navigationRef: ReturnType<typeof useNavigationContainerRef<RootStackParamList>>,
) {
  const { user, initialising } = useAuth()
  const [pendingNoticeId, setPendingNoticeId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const queue = (noticeId?: string) => {
      if (noticeId && active) setPendingNoticeId(noticeId)
    }

    // Expo Go on Android no longer ships remote-push support, so every call
    // here can reject or throw. Deep-linking is a convenience — losing it must
    // never take the app down, so nothing in this block is allowed to escape.
    let subscription: { remove: () => void } | null = null

    try {
      // Cold start: the app was launched by tapping a notification.
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) queue(readNoticeData(response).noticeId)
        })
        .catch(() => {
          // No notification permission, or unsupported in this client.
        })

      subscription = Notifications.addNotificationResponseReceivedListener(
        (response) => queue(readNoticeData(response).noticeId),
      )
    } catch (error) {
      if (__DEV__) console.log('[push] deep links unavailable in this client', error)
    }

    return () => {
      active = false
      subscription?.remove()
    }
  }, [])

  useEffect(() => {
    if (!pendingNoticeId || initialising || !user) return
    if (!navigationRef.isReady()) return
    navigationRef.navigate('NoticeDetail', { noticeId: pendingNoticeId })
    setPendingNoticeId(null)
  }, [pendingNoticeId, user, initialising, navigationRef])
}

function RootNavigator() {
  const { user, initialising } = useAuth()

  if (initialising) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    )
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand },
        headerTintColor: colors.textOnBrand,
        headerTitleStyle: { ...typography.heading, color: colors.textOnBrand },
        headerBackTitle: 'Back',
      }}
    >
      {user ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MarkAttendance"
            component={MarkAttendanceScreen}
            options={({ route }) => ({ title: route.params.subjectCode })}
          />
          <Stack.Screen
            name="ClassReport"
            component={ClassReportScreen}
            options={({ route }) => ({ title: `${route.params.subjectCode} report` })}
          />
          <Stack.Screen
            name="PostNotice"
            component={PostNoticeScreen}
            options={{ title: 'Post a notice' }}
          />
          <Stack.Screen
            name="NoticeDetail"
            component={NoticeDetailScreen}
            options={{ title: 'Notice' }}
          />
        </>
      ) : (
        <Stack.Screen
          name="MainTabs"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  )
}

/**
 * Split out so the deep-link hook can sit inside AuthProvider — it needs the
 * session to know whether the signed-in stack exists yet — while still holding
 * the ref the NavigationContainer is given.
 */
function NavigationRoot() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>()
  useNoticeDeepLinks(navigationRef)

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationRoot />
      </AuthProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})
