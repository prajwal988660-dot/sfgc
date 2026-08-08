// Attendance domain data: classes (with students & subjects) and teachers.
// Live present/total records live in the AttendanceContext store (localStorage),
// which seeds itself from these classes.

export const MIN_ATTENDANCE = 75 // % required to be exam-eligible

export const CLASSES = [
  {
    id: 'bcom-4a',
    label: 'B.Com IV — Section A',
    program: 'B.Com',
    semester: 'IV',
    section: 'A',
    subjects: ['Financial Accounting', 'Business Statistics', 'Corporate Law', 'Income Tax', 'Cost Accounting', 'English'],
    students: [
      { id: 'SFGC101', roll: '01', name: 'Ananya Rao', photo: '👩‍🎓' },
      { id: 'SFGC102', roll: '02', name: 'Rohan Gupta', photo: '👨‍🎓' },
      { id: 'SFGC103', roll: '03', name: 'Sneha Nair', photo: '👩‍🎓' },
      { id: 'SFGC104', roll: '04', name: 'Arjun Menon', photo: '👨‍🎓' },
      { id: 'SFGC105', roll: '05', name: 'Fatima Khan', photo: '👩‍🎓' },
      { id: 'SFGC106', roll: '06', name: 'Vikram Shetty', photo: '👨‍🎓' },
    ],
  },
  {
    id: 'bca-3b',
    label: 'BCA III — Section B',
    program: 'BCA',
    semester: 'III',
    section: 'B',
    subjects: ['Data Structures', 'DBMS', 'Operating Systems', 'Web Technologies', 'Mathematics', 'Kannada'],
    students: [
      { id: 'SFGC201', roll: '01', name: 'Rahul Nair', photo: '👨‍💻' },
      { id: 'SFGC202', roll: '02', name: 'Divya Rao', photo: '👩‍💻' },
      { id: 'SFGC203', roll: '03', name: 'Karan Singh', photo: '👨‍💻' },
      { id: 'SFGC204', roll: '04', name: 'Aisha Begum', photo: '👩‍💻' },
      { id: 'SFGC205', roll: '05', name: 'Nikhil Kumar', photo: '👨‍💻' },
    ],
  },
]

export const TEACHERS = [
  {
    id: 'T01',
    name: 'Prof. Naveen Kumar K S',
    password: 'teacher123',
    department: 'Commerce',
    assignments: [
      { classId: 'bcom-4a', subject: 'Financial Accounting' },
      { classId: 'bcom-4a', subject: 'Cost Accounting' },
    ],
  },
  {
    id: 'T02',
    name: 'Dr. Meera Iyer',
    password: 'teacher123',
    department: 'Computer Science',
    assignments: [
      { classId: 'bca-3b', subject: 'Data Structures' },
      { classId: 'bca-3b', subject: 'DBMS' },
    ],
  },
]

export const SAMPLE_IDS = ['SFGC101', 'SFGC102', 'SFGC201', 'SFGC202']

// Deterministic initial attendance seed so the portal isn't empty on first load.
export function seedRecords() {
  const records = {}
  CLASSES.forEach((cls) => {
    records[cls.id] = {}
    cls.subjects.forEach((subj, j) => {
      records[cls.id][subj] = {}
      cls.students.forEach((st, i) => {
        const total = 38 + ((i * 2 + j * 3) % 10) // 38..47
        const absent = (i + j * 2) % 9 // 0..8
        records[cls.id][subj][st.id] = { present: Math.max(0, total - absent), total }
      })
    })
  })
  return records
}

export function findClassByStudent(id) {
  const key = (id || '').trim().toUpperCase()
  for (const cls of CLASSES) {
    const student = cls.students.find((s) => s.id === key)
    if (student) return { cls, student }
  }
  return null
}

export function getClass(classId) {
  return CLASSES.find((c) => c.id === classId)
}

export function getTeacher(id, password) {
  const t = TEACHERS.find((x) => x.id.toUpperCase() === (id || '').trim().toUpperCase())
  if (!t) return { error: 'No teacher found with that ID.' }
  if (t.password !== password) return { error: 'Incorrect password.' }
  return { teacher: t }
}

// Demo password shared by all students (a real app would store per-student hashes).
export const STUDENT_PASSWORD = 'student123'

export function loginStudent(id, password) {
  const found = findClassByStudent(id)
  if (!found) return { error: 'No student found with that ID.' }
  if (password !== STUDENT_PASSWORD) return { error: 'Incorrect password.' }
  return { id: found.student.id }
}

// Colour band for an attendance percentage
export function band(pct) {
  if (pct >= 75) return 'good'
  if (pct >= 65) return 'warn'
  return 'low'
}
