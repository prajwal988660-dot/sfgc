import type { NavigatorScreenParams } from '@react-navigation/native'

/** Bottom tabs shown once a student is signed in. */
export type MainTabParamList = {
  Dashboard: undefined
  Attendance: undefined
  Progress: undefined
  Events: undefined
  Notices: undefined
}

/** The root stack: tabs plus every drill-down screen. */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined
  EventDetail: { eventId: string; title?: string }
  NoticeDetail: { noticeId: string }
  Profile: undefined
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
