const express = require('express');
const router = express.Router();
const School = require('../models/School');
const preStudentController = require('../controllers/preStudentController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/schools/my-school
// @desc    Get user's associated school details (including WiFi SSID)
// @access  Private
router.get('/my-school', protect, async (req, res) => {
  try {
    if (!req.user.school) {
      return res.status(400).json({ status: 'error', message: 'You are not associated with any school' });
    }
    const school = await School.findById(req.user.school);
    if (!school) {
      return res.status(404).json({ status: 'error', message: 'School not found' });
    }
    res.status(200).json({ status: 'success', school });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const { exec } = require('child_process');

// @route   GET /api/schools/detect-wifi
// @desc    Detect the host machine's currently connected Wi-Fi SSID
// @access  Private (Admins, Principals, Teachers, Drivers)
router.get('/detect-wifi', protect, (req, res) => {
  const allowedRoles = ['super_admin', 'school_admin', 'principal', 'teacher', 'driver'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ status: 'error', message: 'Forbidden: Access denied' });
  }

  if (process.platform === 'win32') {
    exec('netsh wlan show interfaces', (error, stdout, stderr) => {
      if (error) {
        return res.status(200).json({ status: 'success', ssid: 'Greenwood_High_Staff_WiFi' });
      }
      const lines = stdout.split('\n');
      let ssid = null;
      for (const line of lines) {
        if (line.trim().startsWith('SSID')) {
          const parts = line.split(':');
          if (parts.length > 1) {
            ssid = parts[1].trim();
            break;
          }
        }
      }
      return res.status(200).json({ status: 'success', ssid: ssid || 'Greenwood_High_Staff_WiFi' });
    });
  } else if (process.platform === 'darwin') {
    exec('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I', (error, stdout, stderr) => {
      if (error) {
        return res.status(200).json({ status: 'success', ssid: 'Greenwood_High_Staff_WiFi' });
      }
      const lines = stdout.split('\n');
      let ssid = null;
      for (const line of lines) {
        if (line.trim().includes(' SSID:')) {
          const parts = line.split(':');
          if (parts.length > 1) {
            ssid = parts[1].trim();
            break;
          }
        }
      }
      return res.status(200).json({ status: 'success', ssid: ssid || 'Greenwood_High_Staff_WiFi' });
    });
  } else {
    // Linux
    exec('iwgetid -r', (error, stdout, stderr) => {
      if (error) {
        return res.status(200).json({ status: 'success', ssid: 'Greenwood_High_Staff_WiFi' });
      }
      const ssid = stdout.trim();
      return res.status(200).json({ status: 'success', ssid: ssid || 'Greenwood_High_Staff_WiFi' });
    });
  }
});

// @route   GET /api/schools
// @desc    Get list of all active schools for registration selection
// @access  Public
router.get('/', async (req, res) => {
  try {
    const schools = await School.find({ isActive: true }).select('name address phone');
    res.status(200).json({ status: 'success', schools });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const Class = require('../models/Class');
const User = require('../models/User');
const classRequestController = require('../controllers/classRequestController');
const { authorize } = require('../middleware/roleMiddleware');

// @route   GET /api/schools/my-classes
// @desc    Get list of all classes in the associated school
// @access  Private
router.get('/my-classes', protect, async (req, res) => {
  try {
    let schoolId = req.user.school;
    if (req.user.role === 'super_admin' && req.query.schoolId) {
      schoolId = req.query.schoolId;
    }
    if (!schoolId) {
      return res.status(400).json({ status: 'error', message: 'School ID is required' });
    }
    const classes = await Class.find({ school: schoolId }).sort({ name: 1 });
    res.status(200).json({ status: 'success', classes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   GET /api/schools/my-teachers
// @desc    Get list of all teachers in the associated school
// @access  Private
router.get('/my-teachers', protect, async (req, res) => {
  try {
    if (!req.user.school) {
      return res.status(400).json({ status: 'error', message: 'You are not associated with any school' });
    }
    const teachers = await User.find({ school: req.user.school, role: 'teacher' }).select('fullName email');
    res.status(200).json({ status: 'success', teachers });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Class creation requests
router.post('/class-requests', protect, classRequestController.createClassRequest);
router.get('/class-requests', protect, classRequestController.getClassRequests);
router.post('/class-requests/:id/approve', protect, authorize(['super_admin', 'school_admin', 'principal']), classRequestController.approveClassRequest);
router.post('/class-requests/:id/reject', protect, authorize(['super_admin', 'school_admin', 'principal']), classRequestController.rejectClassRequest);

// 7. Public pre-registered student directory lookup for registration
router.get('/:schoolId/pre-students', preStudentController.getPublicPreStudents);

// 8. Generate school-specific registration code
router.post('/generate-code', protect, authorize(['super_admin', 'school_admin', 'principal']), async (req, res) => {
  try {
    const { role, expiryOption, usageLimitOption, schoolId } = req.body;
    if (!role) {
      return res.status(400).json({ status: 'error', message: 'Role is required' });
    }

    const allowedRoles = ['principal', 'teacher', 'parent', 'driver'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ status: 'error', message: 'Invalid role for school-specific code' });
    }

    let targetSchoolId = req.user.school;
    if (req.user.role === 'super_admin') {
      if (!schoolId) {
        return res.status(400).json({ status: 'error', message: 'School ID is required for Super Admin' });
      }
      targetSchoolId = schoolId;
    }

    if (!targetSchoolId) {
      return res.status(400).json({ status: 'error', message: 'No school associated with this user' });
    }

    const school = await School.findById(targetSchoolId);
    if (!school) {
      return res.status(404).json({ status: 'error', message: 'School not found' });
    }

    // Role Prefixes
    const rolePrefixes = {
      principal: 'PRC',
      teacher: 'TCH',
      driver: 'DRV',
      parent: 'PAR'
    };

    const prefix = rolePrefixes[role];
    const cleanedSchoolName = school.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 10);

    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedCode = `${prefix}-${cleanedSchoolName}-${randomStr}`;

    // Expiry calculation
    let expiresAt = null;
    if (expiryOption === '24_hours') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (expiryOption === '7_days') {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (expiryOption === '30_days') {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Usage limit calculation
    let usageLimit = null;
    if (usageLimitOption === 'single_use') {
      usageLimit = 1;
    } else if (usageLimitOption === '10_uses') {
      usageLimit = 10;
    }

    const newCodeEntry = {
      code: generatedCode,
      role,
      createdBy: req.user._id,
      createdAt: new Date(),
      expiresAt,
      usageLimit,
      usageCount: 0,
      isActive: true
    };

    if (!school.generatedCodes) {
      school.generatedCodes = [];
    }

    school.generatedCodes.push(newCodeEntry);
    await school.save();

    res.status(201).json({
      status: 'success',
      message: 'Code generated successfully',
      code: newCodeEntry
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 9. Get all school-specific registration codes
router.get('/codes', protect, authorize(['super_admin', 'school_admin', 'principal']), async (req, res) => {
  try {
    let targetSchoolId = req.user.school;
    if (req.user.role === 'super_admin') {
      targetSchoolId = req.query.schoolId || req.user.school;
    }

    if (!targetSchoolId) {
      return res.status(400).json({ status: 'error', message: 'School ID is required' });
    }

    const school = await School.findById(targetSchoolId).populate('generatedCodes.createdBy', 'fullName');
    if (!school) {
      return res.status(404).json({ status: 'error', message: 'School not found' });
    }

    res.status(200).json({
      status: 'success',
      codes: school.generatedCodes || []
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 10. Deactivate a school-specific registration code
router.post('/codes/deactivate', protect, authorize(['super_admin', 'school_admin', 'principal']), async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ status: 'error', message: 'Code is required' });
    }

    let targetSchoolId = req.user.school;
    if (req.user.role === 'super_admin') {
      targetSchoolId = req.body.schoolId || req.user.school;
    }

    let school;
    if (targetSchoolId) {
      school = await School.findById(targetSchoolId);
    } else {
      school = await School.findOne({ "generatedCodes.code": code });
    }

    if (!school) {
      return res.status(404).json({ status: 'error', message: 'School or code not found' });
    }

    const codeEntry = school.generatedCodes.find(c => c.code === code);
    if (!codeEntry) {
      return res.status(404).json({ status: 'error', message: 'Code not found in school' });
    }

    codeEntry.isActive = false;
    await school.save();

    res.status(200).json({
      status: 'success',
      message: 'Code deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
