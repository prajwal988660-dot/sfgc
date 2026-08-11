'use client'

import * as React from 'react'
import { Copy, Loader2, Plus, Search, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import type { ClassGroup, ManagedStudent } from '@sfgc/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { browserApi, errorMessage } from '@/lib/api'

/**
 * The student roll.
 *
 * Students are added into a class rather than typed in free-form: the class
 * decides the stream, which decides the ID prefix, which is why the admin
 * never types an ID. Picking a class first also means the semester and section
 * cannot contradict each other.
 */
export function StudentsManager() {
  const [classes, setClasses] = React.useState<ClassGroup[]>([])
  const [students, setStudents] = React.useState<ManagedStudent[]>([])
  const [total, setTotal] = React.useState(0)
  const [classFilter, setClassFilter] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [adding, setAdding] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [issued, setIssued] = React.useState<ManagedStudent | null>(null)

  const [form, setForm] = React.useState({
    name: '',
    email: '',
    classGroupId: '',
    phone: '',
    guardianName: '',
    guardianPhone: '',
    registerNo: '',
  })

  React.useEffect(() => {
    void (async () => {
      try {
        setClasses(await browserApi.classes.list())
      } catch (caught) {
        toast.error(errorMessage(caught))
      }
    })()
  }, [])

  const loadStudents = React.useCallback(async () => {
    setLoading(true)
    try {
      const { items, meta } = await browserApi.students.list({
        classGroupId: classFilter || undefined,
        q: search || undefined,
        limit: 200,
      })
      setStudents(items)
      setTotal(meta.total)
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [classFilter, search])

  React.useEffect(() => {
    // Debounced so typing in the search box does not fire a request per keystroke.
    const timer = window.setTimeout(() => void loadStudents(), 250)
    return () => window.clearTimeout(timer)
  }, [loadStudents])

  function startAdd() {
    setAdding(true)
    setIssued(null)
    setForm((current) => ({
      ...current,
      classGroupId: current.classGroupId || classFilter || classes[0]?.id || '',
    }))
  }

  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!form.classGroupId) {
      toast.error('Pick a class first.')
      return
    }

    setSaving(true)
    try {
      const student = await browserApi.students.create({
        name: form.name,
        email: form.email,
        classGroupId: form.classGroupId,
        phone: form.phone || null,
        guardianName: form.guardianName || null,
        guardianPhone: form.guardianPhone || null,
        registerNo: form.registerNo || null,
      })
      // Held on screen rather than toasted: the initial password is shown once
      // and never again, so it must not vanish after four seconds.
      setIssued(student)
      setForm({
        name: '',
        email: '',
        classGroupId: form.classGroupId,
        phone: '',
        guardianName: '',
        guardianPhone: '',
        registerNo: '',
      })
      await loadStudents()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function remove(student: ManagedStudent) {
    if (
      !window.confirm(
        `Delete ${student.name} (${student.studentCode ?? student.registerNo})?\n\nTheir attendance and marks are deleted too. This cannot be undone.`,
      )
    ) {
      return
    }
    try {
      const result = await browserApi.students.remove(student.id)
      toast.success(
        result.attendanceRecordsDeleted > 0
          ? `Deleted, along with ${result.attendanceRecordsDeleted} attendance record(s).`
          : 'Student deleted',
      )
      await loadStudents()
    } catch (caught) {
      toast.error(errorMessage(caught))
    }
  }

  const classLabel = (group: ClassGroup) =>
    `${group.stream.code} · Sem ${group.semester} · ${group.section}`

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            IDs are issued automatically from the stream.
          </p>
        </div>
        {!adding ? (
          <Button onClick={startAdd}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add student
          </Button>
        ) : null}
      </div>

      {issued ? <IssuedCard student={issued} onDismiss={() => setIssued(null)} /> : null}

      {adding ? (
        <form
          onSubmit={create}
          className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-display text-lg font-semibold">New student</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sn-name">Full name</Label>
              <Input
                id="sn-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sn-email">Email</Label>
              <Input
                id="sn-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sn-class">Class</Label>
            <select
              id="sn-class"
              value={form.classGroupId}
              onChange={(e) => setForm({ ...form, classGroupId: e.target.value })}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Choose a class…</option>
              {classes.map((group) => (
                <option key={group.id} value={group.id}>
                  {classLabel(group)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Decides the student ID prefix, the semester and the section.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sn-phone">Phone</Label>
              <Input
                id="sn-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sn-guardian">Guardian</Label>
              <Input
                id="sn-guardian"
                value={form.guardianName}
                onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sn-gphone">Guardian phone</Label>
              <Input
                id="sn-gphone"
                value={form.guardianPhone}
                onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sn-reg">Old register number (optional)</Label>
            <Input
              id="sn-reg"
              value={form.registerNo}
              onChange={(e) => setForm({ ...form, registerNo: e.target.value })}
              placeholder="SFGC141"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add student
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              Done
            </Button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <div className="min-w-[220px] flex-1">
          <Label htmlFor="sf-class" className="sr-only">
            Filter by class
          </Label>
          <select
            id="sf-class"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All classes</option>
            {classes.map((group) => (
              <option key={group.id} value={group.id}>
                {classLabel(group)}
              </option>
            ))}
          </select>
        </div>
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Label htmlFor="sf-q" className="sr-only">
            Search students
          </Label>
          <Input
            id="sf-q"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading students…
        </div>
      ) : students.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No students match.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {students.length} of {total} student(s)
          </p>
          <ul className="space-y-2">
            {students.map((student) => (
              <li
                key={student.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                <Badge variant="outline" className="font-mono">
                  {student.studentCode ?? '—'}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.email}
                    {student.registerNo ? ` · was ${student.registerNo}` : ''}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {student.program} · Sem {student.semester} · {student.section}
                </span>
                <Button variant="ghost" size="sm" onClick={() => void remove(student)}>
                  <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                  <span className="sr-only">Delete {student.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/**
 * Shown once, immediately after an account is created.
 *
 * The password is only ever in this response — nothing can read it back — so
 * it stays on screen until dismissed rather than being toasted away.
 */
function IssuedCard({
  student,
  onDismiss,
}: {
  student: ManagedStudent
  onDismiss: () => void
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `ID: ${student.studentCode}\nEmail: ${student.email}\nPassword: ${student.initialPassword ?? '(set by you)'}`,
      )
      toast.success('Login details copied')
    } catch {
      toast.error('Could not copy — write them down instead.')
    }
  }

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
      <h3 className="font-display text-lg font-semibold">{student.name} added</h3>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Student ID</dt>
          <dd className="mt-0.5 font-mono text-base font-semibold">{student.studentCode}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="mt-0.5 break-all">{student.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">First password</dt>
          <dd className="mt-0.5 font-mono">{student.initialPassword ?? '(the one you set)'}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        Give these to the student. The password cannot be shown again — it can only be
        reset. Ask them to change it when they first sign in.
      </p>
      <div className="mt-4 flex gap-3">
        <Button size="sm" variant="outline" onClick={() => void copy()}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy details
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
