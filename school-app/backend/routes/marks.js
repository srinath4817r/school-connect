const express = require('express');
const router = express.Router();
const markController = require('../controllers/markController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// @route   POST /api/marks
// @desc    Submit student marks for an exam
router.post('/', authorize('teacher'), markController.submitMarks);

// @route   GET /api/marks/student
// @desc    Get child's report card marks and class averages
router.get('/student', authorize('parent'), markController.getStudentMarks);

// @route   GET /api/marks/class
// @desc    Get marks list for a specific class/section
router.get('/class', authorize(['teacher', 'school_admin', 'principal']), markController.getClassMarks);

// @route   GET /api/marks/stats
// @desc    Get school-wide grades average metrics
router.get('/stats', authorize(['school_admin', 'principal']), markController.getSchoolPerformanceStats);

module.exports = router;
