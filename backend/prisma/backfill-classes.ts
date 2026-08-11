/**
 * Fills the tables added alongside period-wise attendance from the data that
 * was already there.
 *
 *   npm run db:backfill --workspace backend
 *
 * The 40 seeded students already carry a program, semester and section as
 * loose strings. This turns those into real Stream and ClassGroup rows, files
 * each student into one, and issues the stream-scoped student IDs. Without it
 * the admin panel opens onto empty lists and every student is unfiled.
 *
 * Idempotent: every write is an upsert or is skipped when already set, so
 * running it twice changes nothing. It never overwrites a studentCode that
 * exists, because that code may already be printed on an ID card.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** "B.Com" -> "BCOM". The code prefixes student IDs, so it must be terse. */
function streamCode(program: string): string {
  return program.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** The college's standard day. Admin can edit these afterwards. */
const PERIODS = [
  { number: 1, startTime: '09:00', endTime: '10:00' },
  { number: 2, startTime: '10:00', endTime: '11:00' },
  { number: 3, startTime: '11:15', endTime: '12:15' },
  { number: 4, startTime: '12:15', endTime: '13:15' },
  { number: 5, startTime: '14:00', endTime: '15:00' },
  { number: 6, startTime: '15:00', endTime: '16:00' },
]

const STREAM_NAMES: Record<string, string> = {
  BCA: 'Bachelor of Computer Applications',
  BCOM: 'Bachelor of Commerce',
  BBA: 'Bachelor of Business Administration',
  BSC: 'Bachelor of Science',
  MCA: 'Master of Computer Applications',
  MCOM: 'Master of Commerce',
  MBA: 'Master of Business Administration',
}

async function main() {
  console.log('\n== periods ==')
  for (const period of PERIODS) {
    await prisma.period.upsert({
      where: { number: period.number },
      update: {},
      create: { ...period, label: `Period ${period.number}` },
    })
  }
  console.log(`  ${PERIODS.length} periods ready`)

  // --- streams, from whatever programs the students actually have ---------
  console.log('\n== streams ==')
  const programs = await prisma.user.findMany({
    where: { role: 'STUDENT', program: { not: null } },
    select: { program: true, department: true },
    distinct: ['program'],
  })

  const streamIdByProgram = new Map<string, string>()
  for (const { program, department } of programs) {
    if (!program) continue
    const code = streamCode(program)
    const stream = await prisma.stream.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: STREAM_NAMES[code] ?? program,
        shortName: program,
        department: department ?? null,
      },
    })
    streamIdByProgram.set(program, stream.id)
    console.log(`  ${program} -> ${code}`)
  }

  // --- class groups, from the distinct triples in use ---------------------
  console.log('\n== class groups ==')
  const triples = await prisma.user.findMany({
    where: { role: 'STUDENT', program: { not: null }, semester: { not: null } },
    select: { program: true, semester: true, section: true },
    distinct: ['program', 'semester', 'section'],
  })

  const groupKey = (program: string, semester: number, section: string) =>
    `${program}|${semester}|${section}`
  const groupIdByKey = new Map<string, string>()

  for (const row of triples) {
    if (!row.program || row.semester === null) continue
    const streamId = streamIdByProgram.get(row.program)
    if (!streamId) continue
    const section = row.section ?? 'A'

    const group = await prisma.classGroup.upsert({
      where: {
        streamId_semester_section_academicYear: {
          streamId,
          semester: row.semester,
          section,
          academicYear: '2026-27',
        },
      },
      update: {},
      create: { streamId, semester: row.semester, section, academicYear: '2026-27' },
    })
    groupIdByKey.set(groupKey(row.program, row.semester, section), group.id)
    console.log(`  ${row.program} sem ${row.semester} section ${section}`)
  }

  // --- student IDs and class membership ----------------------------------
  console.log('\n== students ==')
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      program: true,
      semester: true,
      section: true,
      admissionYear: true,
      registerNo: true,
      studentCode: true,
    },
    // registerNo order keeps the generated serials in the same sequence as the
    // existing numbering, so BCA26001 is the student who was already SFGC101.
    orderBy: { registerNo: 'asc' },
  })

  /// Highest serial already issued per stream, so a re-run continues the
  /// sequence rather than colliding with codes handed out earlier.
  const nextSerial = new Map<string, number>()
  for (const stream of streamIdByProgram.keys()) {
    const code = streamCode(stream)
    const existing = await prisma.user.findMany({
      where: { studentCode: { startsWith: code } },
      select: { studentCode: true },
    })
    const highest = existing.reduce((max, row) => {
      const tail = Number.parseInt((row.studentCode ?? '').slice(-3), 10)
      return Number.isNaN(tail) ? max : Math.max(max, tail)
    }, 0)
    nextSerial.set(code, highest + 1)
  }

  let coded = 0
  let filed = 0

  for (const student of students) {
    if (!student.program || student.semester === null) continue
    const code = streamCode(student.program)
    const streamId = streamIdByProgram.get(student.program)
    const classGroupId = groupIdByKey.get(
      groupKey(student.program, student.semester, student.section ?? 'A'),
    )

    const data: Record<string, unknown> = {}

    if (!student.studentCode) {
      const serial = nextSerial.get(code) ?? 1
      const year = String((student.admissionYear ?? new Date().getFullYear()) % 100).padStart(2, '0')
      data.studentCode = `${code}${year}${String(serial).padStart(3, '0')}`
      nextSerial.set(code, serial + 1)
      coded += 1
    }
    if (streamId) data.streamId = streamId
    if (classGroupId) data.classGroupId = classGroupId

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: student.id }, data })
      filed += 1
    }
  }

  console.log(`  ${coded} student IDs issued, ${filed} students filed into a class`)

  const sample = await prisma.user.findMany({
    where: { role: 'STUDENT', studentCode: { not: null } },
    select: { studentCode: true, registerNo: true, name: true },
    orderBy: { studentCode: 'asc' },
    take: 3,
  })
  console.log('\n  sample:')
  for (const row of sample) {
    console.log(`    ${row.studentCode}  (was ${row.registerNo})  ${row.name}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
