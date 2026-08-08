import type { NavigatorScreenParams } from '@react-navigation/native'

/** Bottom tabs shown once a teacher is signed in. */
export type MainTabParamList = {
  Dashboard: undefined
  Classes: undefined
  Notices: undefined
  Profile: undefined
}

/** The root stack: tabs plus every drill-down screen. */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined
  MarkAttendance: { subjectId: string; subjectName: string; subjectCode: string }
  ClassReport: { subjectId: string; subjectName: string; subjectCode: string }
  PostNotice: undefined
  NoticeDetail: { noticeId: string }
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
