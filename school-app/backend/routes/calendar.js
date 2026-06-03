const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// Read-only endpoints (accessible by parents, teachers, drivers, admins, principal)
router.get('/today/:schoolId', calendarController.getTodayCalendar);
router.get('/:schoolId/:month', calendarController.getCalendarByMonth);

// Write/Edit endpoints (Super Admin, School Admin, Principal only)
router.post('/', authorize(['super_admin', 'school_admin', 'principal']), calendarController.addCalendarEntry);
router.put('/:id', authorize(['super_admin', 'school_admin', 'principal']), calendarController.editCalendarEntry);
router.delete('/:id', authorize(['super_admin', 'school_admin', 'principal']), calendarController.deleteCalendarEntry);

module.exports = router;
