'use client'

import * as React from 'react'
import { Clock, GraduationCap, Layers, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { ClassGroup, Period, Stream } from '@sfgc/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { browserApi, errorMessage } from '@/lib/api'

/**
 * The structural side of the college — the streams that exist, the classes
 * inside them, and the daily period timetable.
 *
 * These three sit on one screen because they are set up together and rarely
 * touched afterwards: a stream is worthless until it has classes, and the
 * timetable has to exist before anyone can mark an hour of attendance.
 */
export function ClassesManager() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Classes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Streams, the sections inside them, and the daily timetable.
        </p>
      </div>

      <Tabs defaultValue="streams">
        <TabsList>
          <TabsTrigger value="streams">
            <GraduationCap className="mr-2 h-4 w-4" aria-hidden="true" />
            Streams
          </TabsTrigger>
          <TabsTrigger value="classes">
            <Layers className="mr-2 h-4 w-4" aria-hidden="true" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="periods">
            <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
            Timetable
          </TabsTrigger>
        </TabsList>

        <TabsContent value="streams" className="mt-6">
          <StreamsPanel />
        </TabsContent>
        <TabsContent value="classes" className="mt-6">
          <ClassesPanel />
        </TabsContent>
        <TabsContent value="periods" className="mt-6">
          <PeriodsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// --------------------------------------------------------------- streams ----

function StreamsPanel() {
  const [streams, setStreams] = React.useState<Stream[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    code: '',
    name: '',
    department: '',
    durationSemesters: '6',
  })

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      setStreams(await browserApi.streams.list())
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await browserApi.streams.create({
        code: form.code,
        name: form.name,
        shortName: form.code,
        department: form.department || null,
        durationSemesters: Number.parseInt(form.durationSemesters, 10) || 6,
      })
      toast.success('Stream added')
      setForm({ code: '', name: '', department: '', durationSemesters: '6' })
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function remove(stream: Stream) {
    if (!window.confirm(`Delete ${stream.code}? Its sections go with it.`)) return
    try {
      await browserApi.streams.remove(stream.id)
      toast.success(`${stream.code} deleted`)
      await load()
    } catch (caught) {
      // The API refuses while students are still filed under it, and says how
      // many — pass that straight through rather than a generic failure.
      toast.error(errorMessage(caught))
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={create}
        className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="space-y-2">
          <Label htmlFor="st-code">Code</Label>
          <Input
            id="st-code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="BCA"
            required
          />
          <p className="text-xs text-muted-foreground">Used to build student IDs.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="st-name">Full name</Label>
          <Input
            id="st-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Bachelor of Computer Applications"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="st-dept">Department</Label>
          <Input
            id="st-dept"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            placeholder="Computer Science"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="st-dur">Semesters</Label>
          <div className="flex gap-2">
            <Input
              id="st-dur"
              type="number"
              min={1}
              max={12}
              value={form.durationSemesters}
              onChange={(e) => setForm({ ...form, durationSemesters: e.target.value })}
            />
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              Add
            </Button>
          </div>
        </div>
      </form>

      {loading ? (
        <Spinner label="Loading streams…" />
      ) : streams.length === 0 ? (
        <Empty>No streams yet. Add one above.</Empty>
      ) : (
        <ul className="space-y-3">
          {streams.map((stream) => (
            <li
              key={stream.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{stream.code}</h3>
                  <Badge variant="outline">{stream.durationSemesters} semesters</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{stream.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stream.classGroupCount ?? 0} section(s) · {stream.studentCount ?? 0} student(s)
                  {stream.department ? ` · ${stream.department}` : ''}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void remove(stream)}>
                <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                <span className="sr-only">Delete {stream.code}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// --------------------------------------------------------------- classes ----

function ClassesPanel() {
  const [streams, setStreams] = React.useState<Stream[]>([])
  const [classes, setClasses] = React.useState<ClassGroup[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({ streamId: '', semester: '1', section: 'A' })

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [streamList, classList] = await Promise.all([
        browserApi.streams.list(),
        browserApi.classes.list(),
      ])
      setStreams(streamList)
      setClasses(classList)
      setForm((current) =>
        current.streamId ? current : { ...current, streamId: streamList[0]?.id ?? '' },
      )
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!form.streamId) {
      toast.error('Add a stream first.')
      return
    }
    setSaving(true)
    try {
      await browserApi.classes.create({
        streamId: form.streamId,
        semester: Number.parseInt(form.semester, 10),
        section: form.section,
      })
      toast.success('Section added')
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function remove(group: ClassGroup) {
    const label = `${group.stream.code} semester ${group.semester} section ${group.section}`
    if (!window.confirm(`Delete ${label}?`)) return
    try {
      await browserApi.classes.remove(group.id)
      toast.success('Section deleted')
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    }
  }

  // Grouped by stream so the page reads like the college's own structure
  // rather than one flat list of every section that exists.
  const byStream = new Map<string, ClassGroup[]>()
  for (const group of classes) {
    const list = byStream.get(group.stream.code) ?? []
    list.push(group)
    byStream.set(group.stream.code, list)
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={create}
        className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="space-y-2">
          <Label htmlFor="cl-stream">Stream</Label>
          <select
            id="cl-stream"
            value={form.streamId}
            onChange={(e) => setForm({ ...form, streamId: e.target.value })}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {streams.map((stream) => (
              <option key={stream.id} value={stream.id}>
                {stream.code}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cl-sem">Semester</Label>
          <Input
            id="cl-sem"
            type="number"
            min={1}
            max={12}
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cl-sec">Section</Label>
          <Input
            id="cl-sec"
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
            placeholder="A"
            maxLength={4}
            required
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            Add section
          </Button>
        </div>
      </form>

      {loading ? (
        <Spinner label="Loading sections…" />
      ) : classes.length === 0 ? (
        <Empty>No sections yet.</Empty>
      ) : (
        <div className="space-y-6">
          {[...byStream.entries()].map(([code, groups]) => (
            <div key={code}>
              <h3 className="font-display text-lg font-semibold">{code}</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                  <li
                    key={group.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        Semester {group.semester} · Section {group.section}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {group.studentCount ?? 0} student(s) · {group.academicYear}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => void remove(group)}>
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                      <span className="sr-only">Delete section</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --------------------------------------------------------------- periods ----

function PeriodsPanel() {
  const [periods, setPeriods] = React.useState<Period[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({ number: '', startTime: '09:00', endTime: '10:00' })

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const list = await browserApi.periods.list()
      setPeriods(list)
      // Pre-fill the next number so adding a period in sequence is one click.
      const nextNumber = (list.reduce((max, p) => Math.max(max, p.number), 0) + 1).toString()
      setForm((current) => ({ ...current, number: current.number || nextNumber }))
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await browserApi.periods.create({
        number: Number.parseInt(form.number, 10),
        startTime: form.startTime,
        endTime: form.endTime,
      })
      toast.success('Period added')
      setForm({ number: '', startTime: '09:00', endTime: '10:00' })
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function saveTime(period: Period, startTime: string, endTime: string) {
    try {
      await browserApi.periods.update(period.id, { startTime, endTime })
      toast.success(`Period ${period.number} updated`)
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    }
  }

  async function remove(period: Period) {
    if (
      !window.confirm(
        `Delete period ${period.number}? Attendance already marked for it keeps its number but loses the times.`,
      )
    ) {
      return
    }
    try {
      const result = await browserApi.periods.remove(period.id)
      toast.success(
        result.attendanceRecordsAffected > 0
          ? `Deleted. ${result.attendanceRecordsAffected} record(s) now show no time.`
          : 'Period deleted',
      )
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        The teacher picks a period when marking attendance, and the student sees these
        times against each class.
      </p>

      <form
        onSubmit={create}
        className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-4"
      >
        <div className="space-y-2">
          <Label htmlFor="pd-num">Period number</Label>
          <Input
            id="pd-num"
            type="number"
            min={1}
            max={12}
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pd-start">Starts</Label>
          <Input
            id="pd-start"
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pd-end">Ends</Label>
          <Input
            id="pd-end"
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            required
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            Add period
          </Button>
        </div>
      </form>

      {loading ? (
        <Spinner label="Loading timetable…" />
      ) : periods.length === 0 ? (
        <Empty>No periods yet. Attendance will fall back to period 1.</Empty>
      ) : (
        <ul className="space-y-3">
          {periods.map((period) => (
            <PeriodRow
              key={period.id}
              period={period}
              onSave={saveTime}
              onDelete={() => void remove(period)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function PeriodRow({
  period,
  onSave,
  onDelete,
}: {
  period: Period
  onSave: (period: Period, startTime: string, endTime: string) => Promise<void>
  onDelete: () => void
}) {
  const [startTime, setStartTime] = React.useState(period.startTime)
  const [endTime, setEndTime] = React.useState(period.endTime)
  const dirty = startTime !== period.startTime || endTime !== period.endTime

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <Badge variant="outline">P{period.number}</Badge>
      <Input
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        className="w-32"
        aria-label={`Period ${period.number} start time`}
      />
      <span className="text-muted-foreground">to</span>
      <Input
        type="time"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
        className="w-32"
        aria-label={`Period ${period.number} end time`}
      />
      {dirty ? (
        <Button size="sm" onClick={() => void onSave(period, startTime, endTime)}>
          Save
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" className="ml-auto" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
        <span className="sr-only">Delete period {period.number}</span>
      </Button>
    </li>
  )
}

// ---------------------------------------------------------------- shared ----

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
      {children}
    </p>
  )
}
