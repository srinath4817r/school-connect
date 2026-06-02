const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/auth/verify-code
// @desc    Verify secret code and return the associated role
// @access  Public
router.post('/verify-code', authController.verifyCode);

// @route   POST /api/auth/register
// @desc    Register a user (One-time, checks role-based secret codes)
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Login user (Validates password & handles 30-min lockout after 5 fails)
// @access  Public
router.post('/login', authController.login);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset link
// @access  Public
router.post('/forgot-password', authController.forgotPassword);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using single-use token
// @access  Public
router.post('/reset-password/:token', authController.resetPassword);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, (req, res) => {
  res.status(200).json({ status: 'success', user: req.user });
});

// @route   POST /api/auth/link-child
// @desc    Link child details for parent
// @access  Private
router.post('/link-child', protect, authController.linkChild);

// @route   GET /api/auth/my-child
// @desc    Get linked child details for parent
// @access  Private
router.get('/my-child', protect, authController.getMyChild);

// @route   PUT /api/auth/update-profile
// @desc    Update user profile details
// @access  Private
router.put('/update-profile', protect, authController.updateProfile);

module.exports = router;

