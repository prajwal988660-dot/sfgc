import 'react-native-gesture-handler'

import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer, DefaultTheme, type Theme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { AuthProvider, useAuth } from '@/store/auth'
import { colors, typography } from '@/theme'
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

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
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
