const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const preStudentController = require('../controllers/preStudentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes here require authentication
router.use(protect);

// 1. Secret codes endpoints
// Super Admin and School Admin can get codes (filtered accordingly)
router.get('/secret-codes', authorize(['super_admin', 'school_admin', 'principal']), adminController.getSecretCodes);
// Only Super Admin can update codes
router.put('/secret-codes', authorize('super_admin'), adminController.updateSecretCode);

// 2. School Admin management (Super Admin only)
router.get('/school-admins', authorize('super_admin'), adminController.getSchoolAdmins);
router.post('/school-admins', authorize('super_admin'), adminController.registerSchoolAdmin);

// 3. School management (Super Admin only)
router.get('/schools', authorize('super_admin'), adminController.getSchools);
router.post('/schools', authorize('super_admin'), adminController.createSchool);
router.put('/schools/profile', authorize(['super_admin', 'school_admin', 'principal']), adminController.updateSchoolDetails);
router.put('/schools/wifi', authorize(['super_admin', 'school_admin', 'principal']), adminController.updateSchoolWifi);
router.put('/schools/photo', authorize(['super_admin', 'school_admin', 'principal']), adminController.updateSchoolPhoto);
router.put('/schools/logo', authorize(['super_admin', 'school_admin', 'principal']), adminController.updateSchoolLogo);
router.put('/schools/:id/toggle-active', authorize('super_admin'), adminController.toggleSchoolActive);
router.put('/schools/:id', authorize('super_admin'), adminController.editSchool);

// 4. School users (School Admin & Principal)
router.get('/school-users', authorize(['school_admin', 'principal']), adminController.getSchoolUsers);

// 5. Temporary invitation codes (Super Admin, School Admin & Principal)
router.get('/temp-codes', authorize(['super_admin', 'school_admin', 'principal']), adminController.getTempInviteCodes);
router.post('/temp-codes', authorize(['super_admin', 'school_admin', 'principal']), adminController.createTempInviteCode);
router.delete('/temp-codes/:id', authorize(['super_admin', 'school_admin', 'principal']), adminController.deleteTempInviteCode);

// 6. Student analytics & directory (Super Admin only)
router.get('/students', authorize('super_admin'), adminController.getStudentsList);
router.put('/users/:id/toggle-active', authorize('super_admin'), adminController.toggleUserActive);
router.put('/users/assign-class', authorize(['super_admin', 'school_admin', 'principal']), adminController.assignClass);

// 7. Pre-registered student directory (Super Admin, School Admin & Principal)
router.get('/pre-students', authorize(['super_admin', 'school_admin', 'principal']), preStudentController.getPreStudents);
router.post('/pre-students/batch', authorize(['super_admin', 'school_admin', 'principal']), preStudentController.batchUpsertPreStudents);
router.delete('/pre-students/:id', authorize(['super_admin', 'school_admin', 'principal']), preStudentController.deletePreStudent);
router.post('/pre-students/extract-pdf', authorize(['super_admin', 'school_admin', 'principal']), preStudentController.extractPdfStudents);

// 8. Parent approval endpoints (Super Admin, School Admin & Principal)
router.get('/pending-parents', authorize(['super_admin', 'school_admin', 'principal']), adminController.getPendingParents);
router.post('/parents/:id/approve', authorize(['super_admin', 'school_admin', 'principal']), adminController.approveParent);
router.post('/parents/:id/reject', authorize(['super_admin', 'school_admin', 'principal']), adminController.rejectParent);

module.exports = router;
