import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { AppButton, AppInput, Card, Screen, SectionTitle } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { colors, radius, spacing, typography } from '@/theme'
import type { RootStackParamList } from '@/navigation/types'
import type { NoticeAudience } from '@sfgc/shared'

type Props = NativeStackScreenProps<RootStackParamList, 'PostNotice'>

const CATEGORIES = ['General', 'Exam', 'Event', 'Holiday', 'Placement'] as const
type Category = (typeof CATEGORIES)[number]

const AUDIENCES: Array<{ label: string; value: NoticeAudience }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Students', value: 'STUDENTS' },
  { label: 'Teachers', value: 'TEACHERS' },
]

const TITLE_MIN = 4
const BODY_MIN = 10

/**
 * Height of a native-stack header, so KeyboardAvoidingView knows how much of
 * the screen the keyboard is really competing with. Derived rather than read
 * from `@react-navigation/elements`, which is only a transitive dependency here
 * and must not be imported directly.
 */
const HEADER_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56

interface FieldErrors {
  title?: string
  body?: string
  semester?: string
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  )
}

export default function PostNoticeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const headerHeight = HEADER_BAR_HEIGHT + insets.top

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<Category>('General')
  const [audience, setAudience] = useState<NoticeAudience>('ALL')
  const [pinned, setPinned] = useState(false)
  const [program, setProgram] = useState('')
  const [semester, setSemester] = useState('')

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const trimmedSemester = semester.trim()

  const validate = useCallback((): FieldErrors => {
    const errors: FieldErrors = {}

    if (title.trim().length < TITLE_MIN) {
      errors.title = `The title needs at least ${TITLE_MIN} characters.`
    }
    if (body.trim().length < BODY_MIN) {
      errors.body = `The notice body needs at least ${BODY_MIN} characters.`
    }
    if (trimmedSemester) {
      const parsed = Number.parseInt(trimmedSemester, 10)
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 8) {
        errors.semester = 'Enter a semester between 1 and 8, or leave this blank.'
      }
    }
    return errors
  }, [title, body, trimmedSemester])

  const submit = useCallback(async () => {
    const errors = validate()
    setFieldErrors(errors)
    setSubmitError(null)
    if (Object.keys(errors).length > 0) return

    // Empty optional fields must be omitted, not sent as "" — the API treats an
    // empty programme as a real narrowing value.
    const trimmedProgram = program.trim()
    const parsedSemester = trimmedSemester
      ? Number.parseInt(trimmedSemester, 10)
      : Number.NaN

    setSubmitting(true)
    try {
      await api.notices.create({
        title: title.trim(),
        body: body.trim(),
        category,
        audience,
        pinned,
        program: trimmedProgram ? trimmedProgram : undefined,
        semester: Number.isNaN(parsedSemester) ? undefined : parsedSemester,
      })
      if (!mounted.current) return
      Alert.alert(
        'Notice published',
        'The notice is live now. Students and staff it targets will receive a push notification.',
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      )
    } catch (err) {
      if (!mounted.current) return
      setSubmitError(errorMessage(err))
    } finally {
      if (mounted.current) setSubmitting(false)
    }
  }, [
    validate,
    title,
    body,
    category,
    audience,
    pinned,
    program,
    trimmedSemester,
    navigation,
  ])

  const audienceHint = useMemo(() => {
    if (audience === 'STUDENTS') return 'Only students will see this notice.'
    if (audience === 'TEACHERS') return 'Only teaching staff will see this notice.'
    return 'Everyone — students, staff and the public website.'
  }, [audience])

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      <Screen>
        {submitError ? (
          <View style={styles.banner}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.bannerText}>{submitError}</Text>
          </View>
        ) : null}

        <Card style={styles.card}>
          <AppInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Semester 3 internal exam timetable"
            error={fieldErrors.title}
            maxLength={140}
            returnKeyType="next"
            autoCapitalize="sentences"
          />

          <AppInput
            label="Notice"
            value={body}
            onChangeText={setBody}
            placeholder="Write the full notice here…"
            error={fieldErrors.body}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={styles.bodyInput}
            autoCapitalize="sentences"
          />
        </Card>

        <SectionTitle title="Category" />
        <View style={styles.chipRow}>
          {CATEGORIES.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={category === option}
              onPress={() => setCategory(option)}
            />
          ))}
        </View>

        <SectionTitle title="Audience" />
        <View style={styles.chipRow}>
          {AUDIENCES.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={audience === option.value}
              onPress={() => setAudience(option.value)}
            />
          ))}
        </View>
        <Text style={[styles.hint, styles.hintTight]}>{audienceHint}</Text>

        <Card style={styles.switchCard}>
          <View style={styles.switchText}>
            <Text style={styles.switchLabel}>Pin this notice</Text>
            <Text style={styles.hint}>Pinned notices stay at the top of every list.</Text>
          </View>
          <Switch
            value={pinned}
            onValueChange={setPinned}
            accessibilityLabel="Pin this notice"
            trackColor={{ false: colors.borderStrong, true: colors.brandLight }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.borderStrong}
          />
        </Card>

        <SectionTitle title="Narrow it down (optional)" />
        <Card style={styles.card}>
          <AppInput
            label="Programme"
            value={program}
            onChangeText={setProgram}
            placeholder="BCA"
            autoCapitalize="characters"
            autoCorrect={false}
            hint="Leave blank to reach every programme."
          />
          <AppInput
            label="Semester"
            value={semester}
            onChangeText={setSemester}
            placeholder="3"
            keyboardType="number-pad"
            maxLength={1}
            error={fieldErrors.semester}
            hint={fieldErrors.semester ? undefined : 'Leave blank to reach every semester.'}
          />
        </Card>

        <AppButton
          label="Publish notice"
          icon="megaphone-outline"
          onPress={() => void submit()}
          loading={submitting}
        />
        <AppButton
          label="Cancel"
          variant="ghost"
          onPress={() => navigation.goBack()}
          disabled={submitting}
        />
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },

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
  bannerText: { ...typography.caption, color: colors.danger, flex: 1, lineHeight: 19 },

  card: { gap: spacing.lg },
  bodyInput: { height: 150, paddingTop: spacing.md, paddingBottom: spacing.md },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipPressed: { opacity: 0.85 },
  chipLabel: { ...typography.caption, color: colors.textMuted },
  chipLabelSelected: { color: colors.textOnBrand },

  hint: { ...typography.caption, color: colors.textFaint },
  hintTight: { marginTop: -spacing.sm },

  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  switchText: { flex: 1, gap: spacing.xs },
  switchLabel: { ...typography.bodyStrong, color: colors.text },
})
