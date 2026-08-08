import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Thin, typed wrapper over AsyncStorage. Every read is defensive: a corrupt or
 * half-written value should log out the user, not crash the app on launch.
 */

const TOKEN_KEY = 'sfgc.teacher.token'
const USER_KEY = 'sfgc.teacher.user'

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    console.warn('[storage] could not persist token', error)
  }
}

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`[storage] could not persist ${key}`, error)
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY])
  } catch (error) {
    console.warn('[storage] could not clear session', error)
  }
}

export const StorageKeys = { TOKEN: TOKEN_KEY, USER: USER_KEY } as const
