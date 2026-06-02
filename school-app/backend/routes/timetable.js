const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// Get timetable for a class and section
router.get('/', timetableController.getTimetable);

// Upload/Upsert timetable day (only Super Admin, School Admin, Principal, and Teacher)
router.post('/', authorize(['super_admin', 'school_admin', 'principal', 'teacher']), timetableController.upsertTimetableDay);

module.exports = router;
