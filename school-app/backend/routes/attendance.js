const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// @route   POST /api/attendance
// @desc    Submit daily student attendance logs
router.post('/', authorize('teacher'), attendanceController.submitAttendance);

// @route   GET /api/attendance/student
// @desc    Get child's attendance stats and history
router.get('/student', authorize('parent'), attendanceController.getStudentAttendance);

// @route   GET /api/attendance/class
// @desc    Get daily attendance logs for class/section
router.get('/class', authorize(['teacher', 'school_admin', 'principal', 'super_admin']), attendanceController.getClassAttendance);

// @route   GET /api/attendance/stats
// @desc    Get school-wide daily attendance summary rates
router.get('/stats', authorize(['school_admin', 'principal']), attendanceController.getSchoolAttendanceStats);

// @route   POST /api/attendance/staff-checkin
// @desc    Submit staff daily check-in (validated by Wi-Fi SSID)
router.post('/staff-checkin', authorize(['teacher', 'driver', 'principal']), attendanceController.staffCheckIn);

// @route   GET /api/attendance/staff-history
// @desc    Get personal staff attendance history
router.get('/staff-history', authorize(['teacher', 'driver', 'principal']), attendanceController.getStaffAttendanceHistory);

// @route   GET /api/attendance/staff-logs
// @desc    Get daily staff check-in logs for management
router.get('/staff-logs', authorize(['super_admin', 'school_admin', 'principal']), attendanceController.getStaffAttendanceLogs);

// @route   POST /api/attendance/retake
// @desc    Request classroom attendance retake
router.post('/retake', authorize(['super_admin', 'school_admin', 'principal']), attendanceController.retakeAttendance);

module.exports = router;
