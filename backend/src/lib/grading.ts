/**
 * The college's grading rules, kept in one place so the write path (POST
 * /progress) and the read path (the progress card) can never disagree about
 * what a set of marks is worth.
 */

export type ResultStatus = 'PASS' | 'FAIL' | 'PENDING'

export interface GradePoint {
  grade: string
  points: number
}

/** The marks half of a progress card line. */
export interface MarkRow {
  internalMarks: number | null
  externalMarks: number | null
  maxInternal: number
  maxExternal: number
}

/** One line of a progress card, reduced to what grading actually needs. */
export interface GradableRow extends MarkRow {
  credits: number
}

export interface ProgressSummary {
  totalObtained: number
  totalMax: number
  percentage: number
  sgpa: number
  resultStatus: ResultStatus
  subjectCount: number
}

const FAIL: GradePoint = { grade: 'F', points: 0 }

/** Ordered high to low; the first band the percentage clears wins. */
const GRADE_BANDS: ReadonlyArray<{ min: number } & GradePoint> = [
  { min: 90, grade: 'O', points: 10 },
  { min: 80, grade: 'A+', points: 9 },
  { min: 70, grade: 'A', points: 8 },
  { min: 60, grade: 'B+', points: 7 },
  { min: 50, grade: 'B', points: 6 },
  { min: 40, grade: 'C', points: 5 },
]

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** Percentage of the total marks for one subject → letter grade and points. */
export function gradeFor(percentage: number): GradePoint {
  if (!Number.isFinite(percentage)) return { ...FAIL }
  for (const band of GRADE_BANDS) {
    if (percentage >= band.min) return { grade: band.grade, points: band.points }
  }
  return { ...FAIL }
}

/** Percentage a row scored, treating a missing mark as zero. */
export function rowPercentage(row: MarkRow): number {
  const maxTotal = row.maxInternal + row.maxExternal
  if (maxTotal <= 0) return 0
  return ((row.internalMarks ?? 0) + (row.externalMarks ?? 0)) / maxTotal * 100
}

/** True once both halves of the subject have been entered. */
function isComplete(row: MarkRow): boolean {
  return row.internalMarks !== null && row.externalMarks !== null
}

/**
 * Aggregates the card's rows into the totals the apps print. Rows still
 * missing a mark are counted at their partial value, which is why an
 * incomplete card reports `PENDING` rather than a result the student could
 * mistake for final.
 */
export function computeSummary(rows: readonly GradableRow[]): ProgressSummary {
  let totalObtained = 0
  let totalMax = 0
  let weightedPoints = 0
  let totalCredits = 0
  let anyPending = false
  let anyFailed = false

  for (const row of rows) {
    totalObtained += (row.internalMarks ?? 0) + (row.externalMarks ?? 0)
    totalMax += row.maxInternal + row.maxExternal

    const { points } = gradeFor(rowPercentage(row))
    weightedPoints += points * row.credits
    totalCredits += row.credits

    if (!isComplete(row)) anyPending = true
    else if (points === 0) anyFailed = true
  }

  return {
    totalObtained,
    totalMax,
    percentage: totalMax > 0 ? round((totalObtained / totalMax) * 100, 1) : 0,
    sgpa: totalCredits > 0 ? round(weightedPoints / totalCredits, 2) : 0,
    resultStatus: anyPending ? 'PENDING' : anyFailed ? 'FAIL' : 'PASS',
    subjectCount: rows.length,
  }
}
