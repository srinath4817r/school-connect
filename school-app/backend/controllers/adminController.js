const User = require('../models/User');
const SecretCode = require('../models/SecretCode');
const School = require('../models/School');
const TempInviteCode = require('../models/TempInviteCode');
const Class = require('../models/Class');
const PreRegisteredStudent = require('../models/PreRegisteredStudent');
const { uploadToCloudinary, deleteFromCloudinary, cloudinary } = require('../utils/cloudinary');

// 1. Get Secret Codes
// Super Admin gets all codes; School Admin gets Principal, Teacher, Parent codes.
exports.getSecretCodes = async (req, res) => {
  try {
    const requesterRole = req.user.role;
    let query = {};

    if (requesterRole === 'school_admin') {
      query = { role: { $in: ['principal', 'teacher', 'parent', 'driver'] } };
    } else if (requesterRole === 'principal') {
      query = { role: { $in: ['teacher', 'parent', 'driver'] } };
    } else if (requesterRole !== 'super_admin') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Access denied' });
    }

    const codes = await SecretCode.find(query).select('role code updatedAt');
    res.status(200).json({ status: 'success', codes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 2. Update Secret Code (Super Admin only)
exports.updateSecretCode = async (req, res) => {
  try {
    const { role, code } = req.body;

    if (!role || !code) {
      return res.status(400).json({ status: 'error', message: 'Role and code are required' });
    }

    const allowedRoles = ['super_admin', 'school_admin', 'principal', 'teacher', 'parent', 'driver'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ status: 'error', message: 'Invalid role specified' });
    }

    let codeRecord = await SecretCode.findOne({ role });
    if (codeRecord) {
      codeRecord.code = code;
      await codeRecord.save();
    } else {
      codeRecord = new SecretCode({ role, code });
      await codeRecord.save();
    }

    res.status(200).json({ 
      status: 'success', 
      message: `Secret code for ${role} updated successfully`, 
      codeRecord 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Get School Admins (Super Admin only)
exports.getSchoolAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'school_admin' })
      .populate('school', 'name address phone isActive')
      .select('-password');
    res.status(200).json({ status: 'success', admins });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Register a new School Admin (Super Admin only)
exports.registerSchoolAdmin = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      schoolId,
      schoolName,
      schoolAddress,
      schoolPhone
    } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Please fill in all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Passwords do not match' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'Email address already registered' });
    }

    let finalSchoolId = null;

    if (schoolName && schoolName.trim()) {
      // Create a new school
      const existingSchool = await School.findOne({ name: schoolName.trim() });
      if (existingSchool) {
        finalSchoolId = existingSchool._id;
      } else {
        if (!schoolAddress || !schoolPhone) {
          return res.status(400).json({ 
            status: 'error', 
            message: 'School address and phone are required to register a new school' 
          });
        }
        const cleanedPhone = schoolPhone.replace(/\D/g, '');
        if (!cleanedPhone) {
          return res.status(400).json({ status: 'error', message: 'School phone number must contain digits only.' });
        }
        const school = new School({
          name: schoolName.trim(),
          address: schoolAddress,
          phone: cleanedPhone
        });
        await school.save();
        finalSchoolId = school._id;
      }
    } else if (schoolId) {
      finalSchoolId = schoolId;
    } else {
      return res.status(400).json({ 
        status: 'error', 
        message: 'School selection or details are required for School Admin registration' 
      });
    }

    const newUser = new User({
      fullName,
      email: normalizedEmail,
      password, // hashed automatically by User pre-save hook
      role: 'school_admin',
      school: finalSchoolId
    });

    await newUser.save();

    res.status(201).json({
      status: 'success',
      message: 'School Admin registered successfully',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        school: newUser.school
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 5. Get all schools with student counts (Super Admin only)
exports.getSchools = async (req, res) => {
  try {
    const schools = await School.find({});
    const schoolsWithStats = await Promise.all(schools.map(async (school) => {
      // Find count of users in this school with role 'parent' (which represents students/parents)
      const studentsCount = await User.countDocuments({ school: school._id, role: 'parent' });
      return {
        ...school.toObject(),
        studentsCount
      };
    }));
    res.status(200).json({ status: 'success', schools: schoolsWithStats });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 6. Create a new school (Super Admin only)
exports.createSchool = async (req, res) => {
  try {
    const { name, address, phone } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({ status: 'error', message: 'All school fields are required' });
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (!cleanedPhone) {
      return res.status(400).json({ status: 'error', message: 'School phone number must contain digits only.' });
    }

    const existingSchool = await School.findOne({ name: name.trim() });
    if (existingSchool) {
      return res.status(400).json({ status: 'error', message: 'School name already exists' });
    }

    const school = new School({
      name: name.trim(),
      address,
      phone: cleanedPhone
    });
    await school.save();

    res.status(201).json({ status: 'success', message: 'School created successfully', school });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 7. Toggle school active/inactive status (Super Admin only)
exports.toggleSchoolActive = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ status: 'error', message: 'School not found' });
    }

    school.isActive = !school.isActive;
    await school.save();

    res.status(200).json({ 
      status: 'success', 
      message: `School is now ${school.isActive ? 'Active' : 'Inactive'}`, 
      school 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 8. Get all users belonging to the logged-in School Admin's school
exports.getSchoolUsers = async (req, res) => {
  try {
    if (!req.user.school) {
      return res.status(400).json({ status: 'error', message: 'User is not associated with any school' });
    }

    const users = await User.find({ school: req.user.school })
      .populate('classAssigned', 'name')
      .select('-password')
      .sort({ role: 1, fullName: 1 });

    res.status(200).json({ status: 'success', users });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 9. Edit school details (Super Admin only)
exports.editSchool = async (req, res) => {
  try {
    const { name, address, phone, wifiSSID } = req.body;
    if (!name || !address || !phone) {
      return res.status(400).json({ status: 'error', message: 'All school fields are required' });
    }

    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ status: 'error', message: 'School not found' });
    }

    // Check if name is taken by another school
    if (name.trim() !== school.name) {
      const existing = await School.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({ status: 'error', message: 'School name already exists' });
      }
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (!cleanedPhone) {
      return res.status(400).json({ status: 'error', message: 'School phone number must contain digits only.' });
    }

    school.name = name.trim();
    school.address = address.trim();
    school.phone = cleanedPhone;
    if (wifiSSID !== undefined) {
      school.wifiSSID = wifiSSID.trim();
    }
    await school.save();

    res.status(200).json({ status: 'success', message: 'School details updated successfully', school });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 10. Get all temporary invite codes
exports.getTempInviteCodes = async (req, res) => {
  try {
    const requesterRole = req.user.role;
    let query = {};

    if (requesterRole === 'school_admin' || requesterRole === 'principal') {
      if (!req.user.school) {
        return res.status(400).json({ status: 'error', message: 'User is not associated with any school' });
      }
      query = { school: req.user.school };
    } else if (requesterRole !== 'super_admin') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Access denied' });
    }

    // Auto-delete expired codes before returning them to keep DB clean
    await TempInviteCode.deleteMany({ expiresAt: { $exists: true, $ne: null, $lt: new Date() } });

    const tempCodes = await TempInviteCode.find(query)
      .populate('school', 'name address')
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', tempCodes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 11. Create a 24-hour temporary or permanent invite code
exports.createTempInviteCode = async (req, res) => {
  try {
    const { role, schoolId, isPermanent, durationHours } = req.body;
    const requesterRole = req.user.role;

    if (!role) {
      return res.status(400).json({ status: 'error', message: 'Role is required' });
    }

    const allowedRoles = ['school_admin', 'principal', 'teacher', 'parent', 'driver'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ status: 'error', message: 'Invalid role for temporary invitation' });
    }

    let finalSchoolId = null;

    if (requesterRole === 'school_admin' || requesterRole === 'principal') {
      if (!req.user.school) {
        return res.status(400).json({ status: 'error', message: 'User is not associated with any school' });
      }
      finalSchoolId = req.user.school;

      // Principal can only create temporary/permanent codes for teacher, parent, and driver
      if (requesterRole === 'principal' && !['teacher', 'parent', 'driver'].includes(role)) {
        return res.status(403).json({ status: 'error', message: 'Principals can only generate teacher, parent, and driver invitation codes' });
      }
    } else if (requesterRole === 'super_admin') {
      if (role !== 'super_admin' && schoolId) {
        finalSchoolId = schoolId;
      }
    } else {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Access denied' });
    }

    // Generate random code in format: [SCHOOL-NAME]-[ROLE]-[5 RAND CHARS]
    let schoolNamePrefix = '';
    if (finalSchoolId) {
      const school = await School.findById(finalSchoolId);
      if (school) {
        // Clean school name: remove non-alphanumeric chars, replace spaces with hyphens, convert to uppercase
        schoolNamePrefix = school.name
          .toUpperCase()
          .replace(/[^A-Z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-') + '-';
      }
    }

    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const generatedCode = `${schoolNamePrefix}${role.toUpperCase()}-${randomSuffix}`;

    const tempCodeData = {
      code: generatedCode,
      role,
      school: finalSchoolId
    };

    if (!isPermanent) {
      const hours = Number(durationHours) || 24;
      tempCodeData.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000); 
    }

    const tempCode = new TempInviteCode(tempCodeData);
    await tempCode.save();

    const hours = Number(durationHours) || 24;
    res.status(201).json({ 
      status: 'success', 
      message: isPermanent 
        ? 'Permanent school invitation code generated successfully' 
        : `Temporary ${hours}-hour invitation code generated successfully`, 
      tempCode 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 12. Get all students (parents) populated with school details (Super Admin only)
exports.getStudentsList = async (req, res) => {
  try {
    const students = await User.find({ role: 'parent' })
      .populate('school', 'name address phone')
      .select('-password')
      .sort({ fullName: 1 });

    res.status(200).json({ status: 'success', students });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 13. Toggle user active status (Super Admin only)
exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ 
      status: 'success', 
      message: `User ${user.fullName} status updated successfully`, 
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 14. Update School WiFi SSID (Super Admin, School Admin, Principal)
exports.updateSchoolWifi = async (req, res) => {
  try {
    const { wifiSSID, schoolId } = req.body;
    if (!wifiSSID) {
      return res.status(400).json({ status: 'error', message: 'WiFi SSID is required' });
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

    school.wifiSSID = wifiSSID.trim();
    await school.save();

    res.status(200).json({
      status: 'success',
      message: `School WiFi settings updated successfully to SSID: "${school.wifiSSID}"`,
      school
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 15. Assign class and section to a teacher or parent
exports.assignClass = async (req, res) => {
  try {
    const { userId, classId, section, subject } = req.body;
    if (!userId) {
      return res.status(400).json({ status: 'error', message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Verify authorized user belongs to same school (unless super_admin)
    if (req.user.role !== 'super_admin' && user.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to this user' });
    }

    user.classAssigned = classId || null;
    user.sectionAssigned = section || 'A';

    // Assign subject if user is a teacher
    if (user.role === 'teacher' && subject !== undefined) {
      user.subjects = subject ? [subject] : [];
    }

    await user.save();

    const populatedUser = await User.findById(userId).populate('classAssigned', 'name').select('-password');

    res.status(200).json({ 
      status: 'success', 
      message: `Successfully assigned class to ${user.fullName}`,
      user: populatedUser
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 16. Delete a temporary/school invite code
exports.deleteTempInviteCode = async (req, res) => {
  try {
    const { id } = req.params;
    const tempCode = await TempInviteCode.findById(id);
    if (!tempCode) {
      return res.status(404).json({ status: 'error', message: 'Invitation code not found' });
    }

    // Role checks: Super Admin can delete anything. School Admin and Principal can only delete if the school matches.
    if (req.user.role !== 'super_admin') {
      if (!req.user.school || tempCode.school.toString() !== req.user.school.toString()) {
        return res.status(403).json({ status: 'error', message: 'Forbidden: You cannot delete invitation codes for another school' });
      }
    }

    await TempInviteCode.deleteOne({ _id: id });
    res.status(200).json({ status: 'success', message: 'Invitation code deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 17. Get all pending parent requests for a school
exports.getPendingParents = async (req, res) => {
  try {
    let targetSchoolId = req.user.school;
    if (req.user.role === 'super_admin') {
      targetSchoolId = req.query.schoolId || req.user.school;
    }

    if (!targetSchoolId) {
      return res.status(400).json({ status: 'error', message: 'School ID is required' });
    }

    // Find all parents in pending state
    const pendingParents = await User.find({
      school: targetSchoolId,
      role: 'parent',
      approvalStatus: 'pending'
    }).select('-password').sort({ createdAt: -1 });

    // For each pending parent, retrieve the student details they selected/entered
    const parentsWithChildren = await Promise.all(pendingParents.map(async (parent) => {
      const student = await PreRegisteredStudent.findOne({ parent: parent._id })
        .select('name className section rollNumber admissionNumber dateOfBirth');
      return {
        ...parent.toObject(),
        student: student || null
      };
    }));

    res.status(200).json({
      status: 'success',
      parents: parentsWithChildren
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 18. Approve parent registration request
exports.approveParent = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await User.findById(id);
    if (!parent) {
      return res.status(404).json({ status: 'error', message: 'Parent request not found' });
    }

    if (parent.role !== 'parent') {
      return res.status(400).json({ status: 'error', message: 'User is not a parent' });
    }

    // Validate school association
    if (req.user.role !== 'super_admin' && parent.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to this school\'s records' });
    }

    parent.approvalStatus = 'approved';
    parent.approvedBy = req.user._id;
    parent.approvedAt = new Date();
    await parent.save();

    console.log(`[APPROVAL] Parent ${parent.fullName} (${parent.email}) has been approved by ${req.user.fullName}`);
    
    // Log nodemailer/simulation link
    console.log(`\n==========================================`);
    console.log(`[EMAIL SIMULATION FOR ${parent.email}]`);
    console.log(`Subject: Your account is approved!`);
    console.log(`Content: Your account is approved! Login to access your child's information.`);
    console.log(`==========================================\n`);

    res.status(200).json({
      status: 'success',
      message: 'Parent request approved successfully'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 19. Reject parent registration request
exports.rejectParent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const parent = await User.findById(id);
    if (!parent) {
      return res.status(404).json({ status: 'error', message: 'Parent request not found' });
    }

    if (parent.role !== 'parent') {
      return res.status(400).json({ status: 'error', message: 'User is not a parent' });
    }

    // Validate school association
    if (req.user.role !== 'super_admin' && parent.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to this school\'s records' });
    }

    parent.approvalStatus = 'rejected';
    parent.rejectionReason = reason || 'No reason specified';
    await parent.save();

    // Clear reference in PreRegisteredStudent
    await PreRegisteredStudent.updateMany(
      { parent: parent._id },
      { $set: { parent: null } }
    );

    console.log(`[REJECTION] Parent ${parent.fullName} (${parent.email}) rejected by ${req.user.fullName}. Reason: ${reason}`);

    res.status(200).json({
      status: 'success',
      message: 'Parent request rejected successfully'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 20. Update School Profile Cover/Photo (Super Admin, School Admin, Principal)
exports.updateSchoolPhoto = async (req, res) => {
  try {
    const { schoolPhoto, schoolId } = req.body;
    if (!schoolPhoto) {
      return res.status(400).json({ status: 'error', message: 'School photo is required' });
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

    if (schoolPhoto.startsWith('data:image')) {
      const oldPhoto = school.schoolPhoto;
      const uploadedUrl = await uploadToCloudinary(schoolPhoto, 'schools');
      school.schoolPhoto = uploadedUrl;
      await school.save();

      if (oldPhoto) {
        await deleteFromCloudinary(oldPhoto);
      }

      return res.status(200).json({
        status: 'success',
        message: 'School cover photo updated successfully',
        schoolPhoto: uploadedUrl,
        school
      });
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid image format. Expected base64 Data URI.' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 22. Update School profile details (Super Admin, School Admin, Principal)
exports.updateSchoolDetails = async (req, res) => {
  try {
    const { name, address, phone, wifiSSID, schoolId } = req.body;
    if (!name || !address || !phone) {
      return res.status(400).json({ status: 'error', message: 'Name, address, and phone are required' });
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

    // Check if name is taken by another school
    if (name.trim() !== school.name) {
      const existing = await School.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({ status: 'error', message: 'School name already exists' });
      }
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (!cleanedPhone) {
      return res.status(400).json({ status: 'error', message: 'School phone number must contain digits only.' });
    }

    school.name = name.trim();
    school.address = address.trim();
    school.phone = cleanedPhone;
    if (wifiSSID !== undefined) {
      school.wifiSSID = wifiSSID.trim();
    }

    await school.save();

    res.status(200).json({ status: 'success', message: 'School profile details updated successfully', school });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 23. Update School Logo (Super Admin, School Admin, Principal)
exports.updateSchoolLogo = async (req, res) => {
  try {
    const { schoolLogo, schoolId } = req.body;
    if (!schoolLogo) {
      return res.status(400).json({ status: 'error', message: 'School logo is required' });
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

    // Size check for 2MB limit
    const approxSizeBytes = (schoolLogo.length * 3) / 4;
    if (approxSizeBytes > 2 * 1024 * 1024) {
      return res.status(400).json({ status: 'error', message: 'Image size exceeds the 2MB limit' });
    }

    if (schoolLogo.startsWith('data:image')) {
      const oldLogo = school.logoUrl;
      const result = await cloudinary.uploader.upload(schoolLogo, {
        folder: 'school_connect/school-logos',
        resource_type: 'image',
        transformation: [
          { width: 200, height: 200, crop: 'fill' }
        ]
      });

      school.logoUrl = result.secure_url;
      await school.save();

      if (oldLogo) {
        await deleteFromCloudinary(oldLogo);
      }

      return res.status(200).json({
        status: 'success',
        message: 'School logo updated successfully',
        logoUrl: result.secure_url,
        school
      });
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid image format. Expected base64 Data URI.' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

