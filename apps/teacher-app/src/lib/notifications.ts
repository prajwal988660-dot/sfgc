import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

import { api } from './api'
import { colors } from '@/theme'

/**
 * Expo push notifications for college notices.
 *
 * Mirrors the student app's module. Teachers need this for the same reason
 * students do — a notice addressed to TEACHERS is pushed by the backend
 * (`services/push.ts`) to every account with a stored token, and until this
 * existed the teacher app never stored one, so those notices reached nobody.
 *
 * Nothing in here may throw into a caller: a teacher who declines the
 * permission prompt, or runs on a simulator, must still get a working app —
 * they simply do not receive pushes.
 */

// Show notices that arrive while the app is open, rather than swallowing them.
//
// Guarded because this runs at module scope: in a client without push support
// (Expo Go on Android) a throw here would break the import chain and take the
// whole app down before it renders a single screen.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
} catch (error) {
  console.warn('[push] notification handler unavailable in this client', error)
}

/** Android needs an explicit channel or heads-up notices are silent. */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('default', {
    name: 'College notices',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: colors.brand,
    sound: 'default',
  })
}

/**
 * Resolves the EAS project id the push service needs to mint a token.
 *
 * Both apps currently carry a placeholder id of all zeros in app.json. Until
 * `eas init` writes a real one, `getExpoPushTokenAsync` below fails and this
 * module returns null — which is why no device has ever stored a token.
 */
function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined
  )
}

/**
 * Asks for permission, mints an Expo push token and registers it with the
 * backend so `POST /notices` can reach this device.
 * Returns the token, or null when push is unavailable for any reason.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    await ensureAndroidChannel()

    // Push tokens are only issued to real hardware.
    if (!Device.isDevice) {
      if (__DEV__) {
        console.log('[push] skipped — push notifications need a physical device')
      }
      return null
    }

    const existing = await Notifications.getPermissionsAsync()
    let status = existing.status

    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync()
      status = requested.status
    }

    if (status !== 'granted') {
      if (__DEV__) console.log('[push] permission not granted')
      return null
    }

    const projectId = getProjectId()
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
    const token = tokenResponse.data
    if (!token) return null

    await api.auth.savePushToken(token)
    if (__DEV__) console.log('[push] registered', token)
    return token
  } catch (error) {
    // A failure here is never fatal — log it and carry on.
    console.warn('[push] could not register for notifications', error)
    return null
  }
}

export type NoticeNotificationData = {
  type?: string
  noticeId?: string
}

/** Reads the payload the backend attaches, for deep-linking into a notice. */
export function readNoticeData(
  response: Notifications.NotificationResponse,
): NoticeNotificationData {
  const data = response.notification.request.content.data
  if (!data || typeof data !== 'object') return {}
  return data as NoticeNotificationData
}
