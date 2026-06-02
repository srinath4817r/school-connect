const express = require('express');
const router = express.Router();
const diaryController = require('../controllers/diaryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// @route   GET /api/diaries/today
// @desc    Get today's classroom diary entry
router.get('/today', diaryController.getTodayDiary);

// @route   GET /api/diaries/history
// @desc    Get past diary entries
router.get('/history', diaryController.getDiaryHistory);

// @route   POST /api/diaries
// @desc    Create or update today's classroom diary entry
router.post('/', authorize('teacher'), diaryController.createOrUpdateDiary);

// @route   POST /api/diaries/:id/homework/:subjectIndex/complete
// @desc    Toggle checkmark for a subject's homework
router.post('/:id/homework/:subjectIndex/complete', authorize('parent'), diaryController.toggleHomeworkComplete);

// @route   GET /api/diaries/class
// @desc    Get school-wide diary logs for principals and admins
router.get('/class', authorize(['school_admin', 'principal']), diaryController.getClassDiaries);

// @route   POST /api/diaries/:id/read
// @desc    Mark a diary as read
router.post('/:id/read', authorize('parent'), diaryController.markDiaryAsRead);

// @route   GET /api/diaries/:id/read-status
// @desc    Get parents read status list
router.get('/:id/read-status', authorize(['teacher', 'school_admin', 'principal']), diaryController.getDiaryReadStatus);

module.exports = router;
