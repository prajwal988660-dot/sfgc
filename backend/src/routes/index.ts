import { Router } from 'express'

import authRoutes from './auth.routes'
import subjectRoutes from './subjects.routes'
import attendanceRoutes from './attendance.routes'
import eventRoutes from './events.routes'
import noticeRoutes from './notices.routes'
import progressRoutes from './progress.routes'
import mediaRoutes from './media.routes'
import materialRoutes from './materials.routes'
import galleryRoutes from './gallery.routes'
import {
  streamRoutes,
  classGroupRoutes,
  periodRoutes,
  studentRoutes,
} from './academics.routes'
import miscRoutes from './misc.routes'

const router = Router()

router.use('/', miscRoutes) // /health, /stats/public
router.use('/auth', authRoutes)
router.use('/subjects', subjectRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/events', eventRoutes)
router.use('/notices', noticeRoutes)
router.use('/progress', progressRoutes)
router.use('/media', mediaRoutes)
router.use('/materials', materialRoutes)
router.use('/gallery', galleryRoutes)
router.use('/streams', streamRoutes)
router.use('/classes', classGroupRoutes)
router.use('/periods', periodRoutes)
router.use('/students', studentRoutes)

export default router
