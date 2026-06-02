const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const SecretCode = require('../models/SecretCode');
const RegistrationAttempt = require('../models/RegistrationAttempt');
const School = require('../models/School');
const Class = require('../models/Class');
const TempInviteCode = require('../models/TempInviteCode');
const PreRegisteredStudent = require('../models/PreRegisteredStudent');
const { uploadToCloudinary, deleteFromCloudinary, cloudinary } = require('../utils/cloudinary');

// Helper to generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'your_secret_key_here',
    { expiresIn: '7d' }
  );
};

// Password requirements: min 8 chars, 1 capital letter, 1 number, 1 special character
const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  return passwordRegex.test(password);
};

// Registration Controller (One-time only per account)
exports.register = async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      password, 
      confirmPassword, 
      secretCode,
      // Teacher specific fields
      subjects,
      primaryClass,
      primarySection,
      classesTeaching,
      // Driver specific fields
      vehicleNumber,
      licenseNumber,
      phone,
      // Parent specific fields
      fatherName,
      motherName,
      fatherPhone,
      motherPhone,
      relationship,
      emergencyContact,
      homeAddress,
      preRegisteredStudentId, // Option A: child selected from list
      // Option B: Manual Entry
      childFullName,
      childClass,
      childSection,
      childRollNumber,
      childDateOfBirth
    } = req.body;

    // Check basic required fields
    if (!fullName || !email || !password || !confirmPassword || !secretCode) {
      return res.status(400).json({ status: 'error', message: 'All basic registration fields are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if email is currently blocked for registration
    let regAttempt = await RegistrationAttempt.findOne({ email: normalizedEmail });
    if (regAttempt && regAttempt.isBlocked()) {
      const waitMinutes = Math.ceil((regAttempt.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ 
        status: 'error', 
        message: `Too many wrong secret code attempts. Email is blocked. Try again in ${waitMinutes} minutes.` 
      });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'Email address already registered' });
    }

    // 3. Validate password requirements
    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Passwords do not match' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character.' 
      });
    }

    // 4. Retrieve and verify registration Secret Code (global or school-specific)
    let finalSchoolId = null;
    let finalRole = null;
    let isGlobalCode = false;
    let isSchoolSpecificCode = false;
    let schoolDoc = null;
    let codeRecord = null;

    const trimmedCode = secretCode.trim();

    // Try global code first
    const globalCode = await SecretCode.findOne({ code: trimmedCode });
    if (globalCode) {
      if (globalCode.role !== 'super_admin' && globalCode.role !== 'school_admin') {
        return res.status(400).json({ status: 'error', message: 'This global registration code is deprecated.' });
      }
      finalRole = globalCode.role;
      isGlobalCode = true;
    } else {
      // Try school-specific code
      schoolDoc = await School.findOne({ "generatedCodes.code": trimmedCode });
      if (schoolDoc) {
        codeRecord = schoolDoc.generatedCodes.find(c => c.code === trimmedCode);
        if (codeRecord) {
          if (!codeRecord.isActive) {
            return res.status(401).json({ status: 'error', message: 'This registration code has been deactivated' });
          }
          if (codeRecord.expiresAt && Date.now() > codeRecord.expiresAt) {
            return res.status(401).json({ status: 'error', message: 'This registration code has expired' });
          }
          if (codeRecord.usageLimit && codeRecord.usageCount >= codeRecord.usageLimit) {
            return res.status(401).json({ status: 'error', message: 'This registration code has reached its usage limit' });
          }
          finalRole = codeRecord.role;
          finalSchoolId = schoolDoc._id;
          isSchoolSpecificCode = true;
        }
      }
    }

    if (!finalRole) {
      // Secret code is wrong. Log attempt.
      if (!regAttempt) {
        regAttempt = new RegistrationAttempt({ email: normalizedEmail, attempts: 1 });
      } else {
        regAttempt.attempts += 1;
        if (regAttempt.attempts >= 3) {
          regAttempt.lockUntil = new Date(Date.now() + 60 * 60 * 1000); // Lock for 1 hour
        }
      }
      await regAttempt.save();

      const remainingAttempts = 3 - regAttempt.attempts;
      return res.status(401).json({ 
        status: 'error', 
        message: `Incorrect secret code. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining before block.` : 'This email is now blocked for 1 hour.'}` 
      });
    }

    // Secret code is correct. Reset registration attempts.
    if (regAttempt) {
      await RegistrationAttempt.deleteOne({ _id: regAttempt._id });
    }

    // 5. Handle School Association for School Admin (when registering using global code)
    if (isGlobalCode && finalRole === 'school_admin') {
      const { schoolName, schoolAddress, schoolPhone } = req.body;
      if (schoolName) {
        const existingSchool = await School.findOne({ name: schoolName.trim() });
        if (existingSchool) {
          finalSchoolId = existingSchool._id;
        } else {
          if (!schoolAddress || !schoolPhone) {
            return res.status(400).json({ status: 'error', message: 'School address and phone are required to register a new school' });
          }
          const cleanedPhone = schoolPhone.replace(/\D/g, '');
          if (!cleanedPhone) {
            return res.status(400).json({ status: 'error', message: 'School phone number must contain digits only.' });
          }
          const newSchool = new School({
            name: schoolName.trim(),
            address: schoolAddress,
            phone: cleanedPhone
          });
          await newSchool.save();
          finalSchoolId = newSchool._id;
        }
      } else if (req.body.schoolId) {
        finalSchoolId = req.body.schoolId;
      } else {
        return res.status(400).json({ status: 'error', message: 'School details are required for School Admin registration' });
      }
    }

    // 6. Create and populate User fields
    const userData = {
      fullName,
      email: normalizedEmail,
      password, // hashed in pre-save hook
      role: finalRole,
      school: finalSchoolId
    };

    // Role-specific fields
    if (finalRole === 'teacher') {
      userData.subjects = subjects || [];
      userData.primaryClass = primaryClass || '';
      userData.primarySection = primarySection || '';
      userData.classesTeaching = classesTeaching || [];
    } else if (finalRole === 'driver') {
      userData.vehicleNumber = vehicleNumber || '';
      userData.licenseNumber = licenseNumber || '';
      userData.phone = phone || '';
    } else if (finalRole === 'parent') {
      userData.fatherName = fatherName || '';
      userData.motherName = motherName || '';
      userData.fatherPhone = fatherPhone || '';
      userData.motherPhone = motherPhone || '';
      userData.relationship = relationship || '';
      userData.emergencyContact = emergencyContact || '';
      userData.homeAddress = homeAddress || '';
      userData.approvalStatus = 'pending'; // Requires admin/principal approval
    }

    const newUser = new User(userData);
    await newUser.save();

    // 7. Handle Parent-Student Association
    if (finalRole === 'parent') {
      if (preRegisteredStudentId) {
        // Option A: Search student from directory
        const preStudent = await PreRegisteredStudent.findById(preRegisteredStudentId);
        if (!preStudent) {
          return res.status(404).json({ status: 'error', message: 'Selected child not found in school directory' });
        }
        
        // Find or create Class doc to populate parent assigned class/section
        let classDoc = await Class.findOne({ school: finalSchoolId, name: preStudent.className });
        if (!classDoc) {
          classDoc = new Class({
            school: finalSchoolId,
            name: preStudent.className,
            sections: [preStudent.section]
          });
          await classDoc.save();
        } else if (!classDoc.sections.includes(preStudent.section)) {
          classDoc.sections.push(preStudent.section);
          await classDoc.save();
        }

        newUser.classAssigned = classDoc._id;
        newUser.sectionAssigned = preStudent.section;
        await newUser.save();

        // Update student record with parent link
        preStudent.parent = newUser._id;
        await preStudent.save();
      } else if (childFullName) {
        // Option B: Manual Entry
        // Create manual PreRegisteredStudent record
        const manualAdmissionNumber = `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`;

        let classDoc = await Class.findOne({ school: finalSchoolId, name: childClass });
        if (!classDoc) {
          classDoc = new Class({
            school: finalSchoolId,
            name: childClass,
            sections: [childSection]
          });
          await classDoc.save();
        } else if (!classDoc.sections.includes(childSection)) {
          classDoc.sections.push(childSection);
          await classDoc.save();
        }

        newUser.classAssigned = classDoc._id;
        newUser.sectionAssigned = childSection;
        await newUser.save();

        const manualStudent = new PreRegisteredStudent({
          school: finalSchoolId,
          name: childFullName,
          admissionNumber: manualAdmissionNumber,
          className: childClass,
          section: childSection,
          rollNumber: childRollNumber || '',
          dateOfBirth: childDateOfBirth ? new Date(childDateOfBirth) : null,
          parent: newUser._id
        });
        await manualStudent.save();
      }
    }

    // 8. Increment code usage count if school-specific
    if (isSchoolSpecificCode && schoolDoc && codeRecord) {
      await School.updateOne(
        { _id: schoolDoc._id, "generatedCodes.code": trimmedCode },
        { $inc: { "generatedCodes.$.usageCount": 1 } }
      );
    }

    res.status(201).json({
      status: 'success',
      message: finalRole === 'parent' 
        ? 'Registration request sent! Waiting for school approval'
        : 'Registration completed successfully. You can now login.',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        school: newUser.school
      }
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: `Server error during registration: ${error.message}` });
  }
};

// Login Controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'No user found with this email' });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({
        status: 'error',
        message: `Account is locked due to too many failed attempts. Try again in ${waitMinutes} minutes.`
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Wrong password
      user.loginAttempts += 1;
      let isLockedNow = false;

      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes lockout
        isLockedNow = true;
      }
      await user.save();

      if (isLockedNow) {
        return res.status(403).json({
          status: 'error',
          message: 'Account locked for 30 minutes due to 5 failed login attempts.'
        });
      }

      const remaining = 5 - user.loginAttempts;
      return res.status(401).json({
        status: 'error',
        message: `Incorrect password. ${remaining} attempt(s) remaining before lockout.`
      });
    }

    // Login successful - Reset lockouts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Check Parent approval status
    if (user.role === 'parent') {
      if (user.approvalStatus === 'rejected') {
        return res.status(403).json({
          status: 'error',
          message: `Your registration request was rejected. Reason: ${user.rejectionReason || 'No reason specified'}`
        });
      }
    }

    // Check if user account is deactivated
    if (user.isActive === false) {
      return res.status(403).json({ status: 'error', message: 'Your account has been deactivated. Access denied.' });
    }

    // Check school active status for non-super-admins
    if (user.role !== 'super_admin' && user.school) {
      const school = await School.findById(user.school);
      if (!school || !school.isActive) {
        return res.status(403).json({ status: 'error', message: 'Your school is currently deactivated. Access denied.' });
      }
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        school: user.school,
        classAssigned: user.classAssigned,
        sectionAssigned: user.sectionAssigned,
        approvalStatus: user.approvalStatus,
        profilePhoto: user.profilePhoto,
        profilePhotoUrl: user.profilePhotoUrl
      }
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: `Server error during login: ${error.message}` });
  }
};

// Forgot Password Controller
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email address is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account found with this email address.'
      });
    }

    // Generate single-use reset token valid for 30 mins
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    // Reset Link URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // Log link to console for debugging in case email fails or during development
    console.log(`\n==========================================`);
    console.log(`[PASSWORD RESET REQUEST FOR ${user.email}]`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log(`==========================================\n`);

    // Setup nodemailer
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '465');
    
    // Check if configuration exists before sending
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: `"School Connect Support" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'School Connect Password Reset Request',
        html: `
          <h3>Password Reset Request</h3>
          <p>You requested a password reset for your School Connect account.</p>
          <p>Click the link below to reset your password. This link is valid for 30 minutes and is for single use only:</p>
          <a href="${resetUrl}" target="_blank">${resetUrl}</a>
          <br/><br/>
          <p>If you did not request this, you can safely ignore this email.</p>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Password reset link sent to ${user.email}`);
      } catch (emailError) {
        console.error(`[EMAIL ERROR] Failed to send password reset email to ${user.email}: ${emailError.message}`);
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'A password reset link has been sent to your email.'
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: `Server error during forgot password: ${error.message}` });
  }
};

// Reset Password Controller
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Password and Confirm Password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Passwords do not match' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character.' 
      });
    }

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Password reset token is invalid or has expired' });
    }

    // Update password, clear token and expiry
    user.password = password; // Pre-save hooks hashes it automatically
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Also reset login lockout attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password has been successfully updated. You can now login with your new password.'
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: `Server error during reset password: ${error.message}` });
  }
};

// Verify secret code and return role/school pre-fill details
exports.verifyCode = async (req, res) => {
  try {
    const { secretCode } = req.body;
    if (!secretCode) {
      return res.status(400).json({ status: 'error', message: 'Secret code is required' });
    }

    const trimmed = secretCode.trim();

    // 1. Check if it's a global secret code (Super Admin or School Admin)
    const globalCode = await SecretCode.findOne({ code: trimmed });
    if (globalCode) {
      if (globalCode.role !== 'super_admin' && globalCode.role !== 'school_admin') {
        return res.status(401).json({ status: 'error', message: 'This global code is no longer valid' });
      }
      return res.status(200).json({
        status: 'success',
        type: 'global',
        role: globalCode.role
      });
    }

    // 2. Check if it's a school-specific code (Principal, Teacher, Driver, Parent)
    const school = await School.findOne({ "generatedCodes.code": trimmed });
    if (school) {
      const codeRecord = school.generatedCodes.find(c => c.code === trimmed);
      if (codeRecord) {
        if (!codeRecord.isActive) {
          return res.status(401).json({ status: 'error', message: 'This registration code has been deactivated' });
        }
        if (codeRecord.expiresAt && Date.now() > codeRecord.expiresAt) {
          return res.status(401).json({ status: 'error', message: 'This registration code has expired' });
        }
        if (codeRecord.usageLimit && codeRecord.usageCount >= codeRecord.usageLimit) {
          return res.status(401).json({ status: 'error', message: 'This registration code has reached its usage limit' });
        }

        return res.status(200).json({
          status: 'success',
          type: 'school_specific',
          role: codeRecord.role,
          school: {
            id: school._id,
            name: school.name
          }
        });
      }
    }

    return res.status(401).json({ status: 'error', message: 'Incorrect or invalid secret code' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: `Server error during code verification: ${error.message}` });
  }
};

// Link child details for parent (during pending approval phase)
exports.linkChild = async (req, res) => {
  try {
    const parentId = req.user._id;
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(400).json({ status: 'error', message: 'User must be a parent' });
    }

    const { 
      preRegisteredStudentId, 
      childFullName, 
      childClass, 
      childSection, 
      childRollNumber, 
      childDateOfBirth 
    } = req.body;

    const schoolId = parent.school;

    // Reset previous child links first to avoid multiple parents/previous links issues
    await PreRegisteredStudent.updateMany({ parent: parentId }, { parent: null });

    if (preRegisteredStudentId) {
      // Find from directory
      const preStudent = await PreRegisteredStudent.findById(preRegisteredStudentId);
      if (!preStudent) {
        return res.status(404).json({ status: 'error', message: 'Selected student not found in directory' });
      }

      // Find or create Class doc
      let classDoc = await Class.findOne({ school: schoolId, name: preStudent.className });
      if (!classDoc) {
        classDoc = new Class({
          school: schoolId,
          name: preStudent.className,
          sections: [preStudent.section]
        });
        await classDoc.save();
      } else if (!classDoc.sections.includes(preStudent.section)) {
        classDoc.sections.push(preStudent.section);
        await classDoc.save();
      }

      parent.classAssigned = classDoc._id;
      parent.sectionAssigned = preStudent.section;
      await parent.save();

      preStudent.parent = parent._id;
      await preStudent.save();
    } else if (childFullName && childClass && childSection) {
      // Manual entry
      const manualAdmissionNumber = `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`;

      let classDoc = await Class.findOne({ school: schoolId, name: childClass });
      if (!classDoc) {
        classDoc = new Class({
          school: schoolId,
          name: childClass,
          sections: [childSection]
        });
        await classDoc.save();
      } else if (!classDoc.sections.includes(childSection)) {
        classDoc.sections.push(childSection);
        await classDoc.save();
      }

      parent.classAssigned = classDoc._id;
      parent.sectionAssigned = childSection;
      await parent.save();

      const manualStudent = new PreRegisteredStudent({
        school: schoolId,
        name: childFullName.trim(),
        admissionNumber: manualAdmissionNumber,
        className: childClass,
        section: childSection,
        rollNumber: childRollNumber || '',
        dateOfBirth: childDateOfBirth ? new Date(childDateOfBirth) : null,
        parent: parent._id
      });
      await manualStudent.save();
    } else {
      return res.status(400).json({ status: 'error', message: 'Child details are required to link' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Child details updated and linked successfully',
      user: {
        id: parent._id,
        fullName: parent.fullName,
        email: parent.email,
        role: parent.role,
        school: parent.school,
        classAssigned: parent.classAssigned,
        sectionAssigned: parent.sectionAssigned,
        approvalStatus: parent.approvalStatus
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: `Server error during child linking: ${error.message}` });
  }
};

// Get linked child details for parent
exports.getMyChild = async (req, res) => {
  try {
    const student = await PreRegisteredStudent.findOne({ parent: req.user._id })
      .select('name className section rollNumber admissionNumber dateOfBirth');
    res.status(200).json({ status: 'success', student });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Update profile details for different roles (parent, teacher, driver)
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const { 
      fullName, 
      profilePhoto,
      profilePhotoUrl,
      // Parent fields
      fatherName, 
      motherName, 
      fatherPhone, 
      motherPhone, 
      emergencyContact, 
      homeAddress,
      // Driver fields
      vehicleNumber,
      licenseNumber,
      phone,
      // Teacher fields
      primaryClass,
      primarySection
    } = req.body;

    if (fullName) user.fullName = fullName;

    // Upload profile photo to Cloudinary if provided as base64
    const photoToUpload = profilePhotoUrl || profilePhoto;
    if (photoToUpload && photoToUpload.startsWith('data:image')) {
      const approxSizeBytes = (photoToUpload.length * 3) / 4;
      if (approxSizeBytes > 2 * 1024 * 1024) {
        return res.status(400).json({ status: 'error', message: 'Image size exceeds the 2MB limit' });
      }
      try {
        const oldPhoto = user.profilePhotoUrl || user.profilePhoto;
        const result = await cloudinary.uploader.upload(photoToUpload, {
          folder: 'school_connect/profile-photos',
          resource_type: 'image',
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' }
          ]
        });
        user.profilePhoto = result.secure_url;
        user.profilePhotoUrl = result.secure_url;
        if (oldPhoto) {
          await deleteFromCloudinary(oldPhoto);
        }
      } catch (uploadError) {
        return res.status(400).json({ status: 'error', message: `Image upload failed: ${uploadError.message}` });
      }
    }

    if (user.role === 'parent') {
      if (fatherName !== undefined) user.fatherName = fatherName;
      if (motherName !== undefined) user.motherName = motherName;
      if (fatherPhone !== undefined) user.fatherPhone = fatherPhone;
      if (motherPhone !== undefined) user.motherPhone = motherPhone;
      if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
      if (homeAddress !== undefined) user.homeAddress = homeAddress;
    } else if (user.role === 'driver') {
      if (vehicleNumber !== undefined) user.vehicleNumber = vehicleNumber;
      if (licenseNumber !== undefined) user.licenseNumber = licenseNumber;
      if (phone !== undefined) user.phone = phone;
    } else if (user.role === 'teacher') {
      if (primaryClass !== undefined) user.primaryClass = primaryClass;
      if (primarySection !== undefined) user.primarySection = primarySection;
    }

    await user.save();
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Profile updated successfully', 
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        school: user.school,
        classAssigned: user.classAssigned,
        sectionAssigned: user.sectionAssigned,
        approvalStatus: user.approvalStatus,
        profilePhoto: user.profilePhoto,
        profilePhotoUrl: user.profilePhotoUrl,
        subjects: user.subjects,
        primaryClass: user.primaryClass,
        primarySection: user.primarySection,
        fatherName: user.fatherName,
        motherName: user.motherName,
        fatherPhone: user.fatherPhone,
        motherPhone: user.motherPhone,
        relationship: user.relationship,
        emergencyContact: user.emergencyContact,
        homeAddress: user.homeAddress,
        vehicleNumber: user.vehicleNumber,
        licenseNumber: user.licenseNumber,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: `Server error during profile update: ${error.message}` });
  }
};


