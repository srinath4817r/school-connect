const Attendance = require('../models/Attendance');
const User = require('../models/User');
const StaffAttendance = require('../models/StaffAttendance');
const School = require('../models/School');
const Notification = require('../models/Notification');

// Helper to get start and end of a specific date
const getDateRange = (dateString) => {
  const start = dateString ? new Date(dateString) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = dateString ? new Date(dateString) : new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// 1. Submit daily attendance (Teacher only)
exports.submitAttendance = async (req, res) => {
  try {
    const { attendanceData, date, shift = 'Morning' } = req.body;
    const classId = req.user.classAssigned;
    const section = req.user.sectionAssigned;

    if (!classId || !section) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'You must have an assigned class and section to log attendance' 
      });
    }

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No attendance records provided' });
    }

    const { start, end } = getDateRange(date);

    // Check if attendance is already submitted for this class, section, date range, and shift
    const existingCount = await Attendance.countDocuments({
      class: classId,
      section: section.toUpperCase(),
      date: { $gte: start, $lte: end },
      shift
    });

    if (existingCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Attendance has already been submitted for the ${shift} shift on this date and cannot be modified.`
      });
    }

    // Filter students by class and section to verify ownership
    const students = await User.find({ 
      school: req.user.school, 
      classAssigned: classId, 
      sectionAssigned: section.toUpperCase(), 
      role: 'parent' 
    });

    const studentIds = students.map(s => s._id.toString());

    // Filter and update
    for (const record of attendanceData) {
      const { studentId, status } = record;

      if (!studentIds.includes(studentId)) continue; // ignore users not in this class

      // Upsert record
      await Attendance.findOneAndUpdate(
        {
          student: studentId,
          date: { $gte: start, $lte: end },
          shift
        },
        {
          student: studentId,
          school: req.user.school,
          class: classId,
          section: section.toUpperCase(),
          status,
          shift,
          date: start // store at start of day
        },
        { upsert: true, new: true }
      );

      // Create Parent Notification
      try {
        const parent = students.find(s => s._id.toString() === studentId);
        const studentName = parent ? parent.fullName : 'Your child';
        const cleanShift = shift.charAt(0).toUpperCase() + shift.slice(1);
        const message = status === 'Present' || status === 'Late'
          ? `✅ Attendance Update: ${studentName} was marked PRESENT (Status: ${status}) for the ${cleanShift} shift today.`
          : `❌ Attendance Update: ${studentName} was marked ABSENT for the ${cleanShift} shift today.`;

        const newNotification = new Notification({
          school: req.user.school,
          sender: req.user._id,
          recipient: studentId,
          type: 'general',
          message,
          metadata: {
            classId,
            section: section.toUpperCase(),
            date: start,
            shift
          }
        });
        await newNotification.save();
      } catch (err) {
        console.error('Failed to create attendance parent notification:', err);
      }
    }

    res.status(200).json({ status: 'success', message: 'Attendance records saved successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 2. Get child's attendance stats (Parent only)
exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;

    const records = await Attendance.find({ student: studentId })
      .sort({ date: -1 })
      .limit(30); // get last 30 entries

    // Calculate stats
    const total = await Attendance.countDocuments({ student: studentId });
    const present = await Attendance.countDocuments({ student: studentId, status: 'Present' });
    const late = await Attendance.countDocuments({ student: studentId, status: 'Late' });
    const absent = await Attendance.countDocuments({ student: studentId, status: 'Absent' });

    // Present + Late counts as present, late is a minor warning.
    const presentRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    res.status(200).json({
      status: 'success',
      stats: {
        total,
        present,
        absent,
        late,
        presentRate
      },
      records
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Get class attendance for a specific date (Teacher / Principal / Admin)
exports.getClassAttendance = async (req, res) => {
  try {
    const classId = req.query.classId || req.user.classAssigned;
    const section = req.query.section || req.user.sectionAssigned;
    const date = req.query.date;
    const shift = req.query.shift || 'Morning';

    if (!classId || !section) {
      return res.status(400).json({ status: 'error', message: 'Class and section are required' });
    }

    const { start, end } = getDateRange(date);

    // Fetch school ID from user or query
    let schoolQuery = req.user.school;
    if (req.user.role === 'super_admin' && req.query.schoolId) {
      schoolQuery = req.query.schoolId;
    }

    // Get list of all students in class
    const students = await User.find({ 
      school: schoolQuery, 
      classAssigned: classId, 
      sectionAssigned: section.toUpperCase(), 
      role: 'parent' 
    })
      .select('fullName email')
      .sort({ fullName: 1 });

    // Fetch existing attendance records
    const attendanceRecords = await Attendance.find({
      school: schoolQuery,
      class: classId,
      section: section.toUpperCase(),
      date: { $gte: start, $lte: end },
      shift
    });

    // Match them
    const matchedRecords = students.map(student => {
      const record = attendanceRecords.find(r => r.student.toString() === student._id.toString());
      return {
        studentId: student._id,
        fullName: student.fullName,
        email: student.email,
        status: record ? record.status : '' // default to empty string if not marked
      };
    });

    res.status(200).json({ 
      status: 'success', 
      attendance: matchedRecords,
      isSubmitted: attendanceRecords.length > 0 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Get school-wide attendance rate (Principal / Admin)
exports.getSchoolAttendanceStats = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { start, end } = getDateRange();

    const totalMarked = await Attendance.countDocuments({ school: schoolId, date: { $gte: start, $lte: end } });
    const totalPresent = await Attendance.countDocuments({ school: schoolId, status: { $in: ['Present', 'Late'] }, date: { $gte: start, $lte: end } });

    const attendanceRate = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 100;

    res.status(200).json({
      status: 'success',
      stats: {
        totalMarked,
        totalPresent,
        attendanceRate
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 5. Submit staff daily check-in (Teacher / Driver / Principal only, validated by Wi-Fi)
exports.staffCheckIn = async (req, res) => {
  try {
    const { wifiSSID } = req.body;
    if (!wifiSSID) {
      return res.status(400).json({ status: 'error', message: 'Connected WiFi network SSID is required' });
    }

    if (!req.user.school) {
      return res.status(400).json({ status: 'error', message: 'You are not associated with any school' });
    }

    const school = await School.findById(req.user.school);
    if (!school) {
      return res.status(404).json({ status: 'error', message: 'Associated School not found' });
    }

    // Verify WiFi SSID
    if (wifiSSID.trim() !== school.wifiSSID) {
      return res.status(400).json({ 
        status: 'error', 
        message: `Check-in Failed: Connected to "${wifiSSID}", but authorized network is "${school.wifiSSID}". Please connect to the School WiFi.`
      });
    }

    // Get today's local date string
    const todayStr = new Date().toLocaleDateString('en-CA'); // en-CA format returns YYYY-MM-DD

    // Check if already checked in today
    const existingCheckIn = await StaffAttendance.findOne({ staff: req.user._id, date: todayStr });
    if (existingCheckIn) {
      return res.status(400).json({ status: 'error', message: 'You have already checked in for today' });
    }

    // Determine if late (e.g. check-in after 9:00 AM local time)
    const now = new Date();
    const currentHour = now.getHours();
    const status = currentHour >= 9 ? 'Late' : 'Present';

    const newRecord = new StaffAttendance({
      staff: req.user._id,
      school: req.user.school,
      date: todayStr,
      checkInTime: now,
      wifiSSID,
      status
    });

    await newRecord.save();

    res.status(201).json({
      status: 'success',
      message: `Checked in successfully as ${status}!`,
      checkIn: newRecord
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 6. Get personal staff attendance history
exports.getStaffAttendanceHistory = async (req, res) => {
  try {
    const history = await StaffAttendance.find({ staff: req.user._id })
      .sort({ checkInTime: -1 })
      .limit(30);
    
    res.status(200).json({ status: 'success', history });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 7. Get daily staff check-in logs for management (Principal / School Admin / Super Admin)
exports.getStaffAttendanceLogs = async (req, res) => {
  try {
    const schoolId = req.user.school;
    let query = {};
    
    if (req.user.role === 'super_admin') {
      if (req.query.schoolId) {
        query.school = req.query.schoolId;
      }
    } else {
      if (!schoolId) {
        return res.status(400).json({ status: 'error', message: 'User is not associated with any school' });
      }
      query.school = schoolId;
    }
    
    const logs = await StaffAttendance.find(query)
      .populate('staff', 'fullName email role')
      .sort({ checkInTime: -1 })
      .limit(50);
      
    res.status(200).json({ status: 'success', logs });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 8. Request attendance retake (Principal / Admin / Super Admin)
exports.retakeAttendance = async (req, res) => {
  try {
    const { classId, section, date, shift, message } = req.body;

    if (!classId || !section || !date) {
      return res.status(400).json({ status: 'error', message: 'ClassId, section and date are required' });
    }

    const { start, end } = getDateRange(date);

    // Determine target school ID (unless super_admin, use req.user.school)
    let targetSchoolId = req.user.school;
    if (req.user.role === 'super_admin' && req.body.schoolId) {
      targetSchoolId = req.body.schoolId;
    }

    // Determine which shift to retake
    let targetShift = shift;
    if (!targetShift) {
      // Find what shifts are active/submitted for this date
      const activeShifts = await Attendance.distinct('shift', {
        class: classId,
        section: section.toUpperCase(),
        date: { $gte: start, $lte: end }
      });

      if (activeShifts.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No attendance records exist for this class on this date.' });
      } else if (activeShifts.length === 1) {
        targetShift = activeShifts[0];
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Both Morning and Afternoon shifts have submitted logs. Please specify which shift to retake.'
        });
      }
    }

    // Delete attendance records
    const deleteResult = await Attendance.deleteMany({
      class: classId,
      section: section.toUpperCase(),
      date: { $gte: start, $lte: end },
      shift: targetShift
    });

    // Find the teacher assigned to this class and section
    const teacher = await User.findOne({
      role: 'teacher',
      classAssigned: classId,
      sectionAssigned: section.toUpperCase()
    });

    if (teacher) {
      // Create notification for the teacher
      const newNotification = new Notification({
        school: targetSchoolId || req.user.school,
        sender: req.user._id,
        recipient: teacher._id,
        type: 'retake_attendance',
        message: message || `Please retake attendance for your class (Shift: ${targetShift}).`,
        metadata: {
          classId,
          section: section.toUpperCase(),
          date: start,
          shift: targetShift
        }
      });
      await newNotification.save();
    }

    res.status(200).json({
      status: 'success',
      message: `Successfully requested attendance retake for ${targetShift} shift. Deleted ${deleteResult.deletedCount} student logs.`
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

