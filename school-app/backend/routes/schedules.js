const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// Create and update schedules (Principal & School Admin only)
router.post('/', authorize(['school_admin', 'principal']), scheduleController.createSchedule);
router.put('/:id', authorize(['school_admin', 'principal']), scheduleController.updateSchedule);

// View schedules (All authenticated staff/teachers/etc. can view)
router.get('/teacher/:id', scheduleController.getTeacherSchedule);
router.get('/today/:teacherId', scheduleController.getTodayPeriods);

module.exports = router;
