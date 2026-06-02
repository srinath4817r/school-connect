const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// @route   GET /api/fees/student
// @desc    Get child's fee details
router.get('/student', authorize('parent'), feeController.getStudentFee);

// @route   POST /api/fees
// @desc    Create or update a student's billing details
router.post('/', authorize(['school_admin', 'principal']), feeController.updateStudentFee);

// @route   POST /api/fees/:id/pay
// @desc    Simulate payment of fees
router.post('/:id/pay', authorize('parent'), feeController.simulateFeePayment);

// @route   GET /api/fees/school
// @desc    Get school-wide billing list
router.get('/school', authorize(['school_admin', 'principal']), feeController.getSchoolFeesList);

module.exports = router;
