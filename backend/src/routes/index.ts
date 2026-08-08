import { Router } from 'express'

import authRoutes from './auth.routes'
import subjectRoutes from './subjects.routes'
import attendanceRoutes from './attendance.routes'
import eventRoutes from './events.routes'
import noticeRoutes from './notices.routes'
import progressRoutes from './progress.routes'
import miscRoutes from './misc.routes'

const router = Router()

router.use('/', miscRoutes) // /health, /stats/public
router.use('/auth', authRoutes)
router.use('/subjects', subjectRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/events', eventRoutes)
router.use('/notices', noticeRoutes)
router.use('/progress', progressRoutes)

export default router
