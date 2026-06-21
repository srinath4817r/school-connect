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

// @route   GET /api/attendance/class-report
// @desc    Get class attendance report showing overall and month-wise summaries (Teacher only)
router.get('/class-report', authorize('teacher'), attendanceController.getClassAttendanceReport);

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

// @route   POST /api/attendance/leave
// @desc    Submit daily student leave request (Parent only)
router.post('/leave', authorize('parent'), attendanceController.submitLeaveRequest);

// @route   GET /api/attendance/leaves
// @desc    Get leave requests (Parent sees their own, Teacher sees their class)
router.get('/leaves', authorize(['parent', 'teacher']), attendanceController.getLeaveRequests);

// @route   POST /api/attendance/leave/:id/approve
// @desc    Approve student leave request (Teacher only)
router.post('/leave/:id/approve', authorize('teacher'), attendanceController.approveLeaveRequest);

// @route   POST /api/attendance/leave/:id/reject
// @desc    Reject student leave request (Teacher only)
router.post('/leave/:id/reject', authorize('teacher'), attendanceController.rejectLeaveRequest);

module.exports = router;
