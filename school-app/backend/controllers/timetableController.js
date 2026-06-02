const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const User = require('../models/User');

// Fetch the full timetable for a class and section
exports.getTimetable = async (req, res) => {
  try {
    const { classId, section } = req.query;
    if (!classId || !section) {
      return res.status(400).json({ status: 'error', message: 'Class and section are required parameters' });
    }

    // Determine school context
    let targetSchoolId = req.user.school;
    if (req.user.role === 'super_admin') {
      // For super admin, lookup class to get school ID
      const targetClass = await Class.findById(classId);
      if (!targetClass) {
        return res.status(404).json({ status: 'error', message: 'Class not found' });
      }
      targetSchoolId = targetClass.school;
    }

    const timetable = await Timetable.find({
      school: targetSchoolId,
      class: classId,
      section: section
    });

    res.status(200).json({ status: 'success', timetable });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Create or update a timetable day
exports.upsertTimetableDay = async (req, res) => {
  try {
    const { classId, section, day, periods } = req.body;

    if (!classId || !section || !day || !Array.isArray(periods)) {
      return res.status(400).json({ status: 'error', message: 'Class ID, Section, Day, and Periods array are required' });
    }

    const requesterRole = req.user.role;
    const requesterId = req.user._id;

    // Check authority
    if (requesterRole === 'teacher') {
      const teacher = await User.findById(requesterId);
      if (!teacher.classAssigned || teacher.classAssigned.toString() !== classId.toString() || teacher.sectionAssigned !== section) {
        return res.status(403).json({ 
          status: 'error', 
          message: 'Class Teachers can only create or update timetables for their assigned class and section' 
        });
      }
    }

    // Determine school context
    let targetSchoolId = req.user.school;
    if (requesterRole === 'super_admin') {
      const targetClass = await Class.findById(classId);
      if (!targetClass) {
        return res.status(404).json({ status: 'error', message: 'Class not found' });
      }
      targetSchoolId = targetClass.school;
    }

    if (!targetSchoolId) {
      return res.status(400).json({ status: 'error', message: 'User is not associated with any school' });
    }

    // Validate periods
    for (const p of periods) {
      if (!p.periodNumber || !p.time || !p.subject || !p.teacherName) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Each period must contain periodNumber, time, subject, and teacherName' 
        });
      }
    }

    // Upsert the timetable record for this day
    const updated = await Timetable.findOneAndUpdate(
      {
        school: targetSchoolId,
        class: classId,
        section: section,
        day: day
      },
      {
        periods: periods.sort((a, b) => a.periodNumber - b.periodNumber)
      },
      {
        new: true,
        upsert: true
      }
    );

    res.status(200).json({ 
      status: 'success', 
      message: `Successfully uploaded timetable for ${day}`, 
      timetable: updated 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
