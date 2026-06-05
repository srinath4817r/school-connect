const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');

// helper to format day names
const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

// 1. Create schedule
exports.createSchedule = async (req, res) => {
  try {
    const { teacherId, validFrom, validTo, isPermanent, schedule } = req.body;

    if (!teacherId || !schedule) {
      return res.status(400).json({ status: 'error', message: 'Teacher ID and schedule are required' });
    }

    // Determine school context
    const schoolId = req.user.school;
    if (!schoolId) {
      return res.status(400).json({ status: 'error', message: 'You must be associated with a school' });
    }

    // Create schedule doc
    const newSchedule = new Schedule({
      schoolId,
      teacherId,
      createdBy: req.user._id,
      validFrom: isPermanent ? undefined : validFrom,
      validTo: isPermanent ? undefined : validTo,
      isPermanent: !!isPermanent,
      schedule
    });

    await newSchedule.save();

    // Send notification to teacher
    const newNotification = new Notification({
      school: schoolId,
      sender: req.user._id,
      recipient: teacherId,
      type: 'general',
      message: 'Your schedule has been updated'
    });
    await newNotification.save();

    res.status(201).json({
      status: 'success',
      message: 'Schedule created successfully',
      schedule: newSchedule
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 2. Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { validFrom, validTo, isPermanent, schedule } = req.body;

    const existingSchedule = await Schedule.findById(id);
    if (!existingSchedule) {
      return res.status(404).json({ status: 'error', message: 'Schedule not found' });
    }

    existingSchedule.validFrom = isPermanent ? undefined : validFrom;
    existingSchedule.validTo = isPermanent ? undefined : validTo;
    existingSchedule.isPermanent = !!isPermanent;
    if (schedule) {
      existingSchedule.schedule = schedule;
    }

    await existingSchedule.save();

    // Send notification to teacher
    const newNotification = new Notification({
      school: existingSchedule.schoolId,
      sender: req.user._id,
      recipient: existingSchedule.teacherId,
      type: 'general',
      message: 'Your schedule has been updated'
    });
    await newNotification.save();

    res.status(200).json({
      status: 'success',
      message: 'Schedule updated successfully',
      schedule: existingSchedule
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Get teacher schedule
exports.getTeacherSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    // Find the latest active schedule for this teacher
    const schedule = await Schedule.findOne({ teacherId: id }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      schedule: schedule || null
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Get today periods only
exports.getTodayPeriods = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const today = new Date();
    
    // Find latest schedule for this teacher
    const scheduleDoc = await Schedule.findOne({ teacherId }).sort({ createdAt: -1 });
    if (!scheduleDoc) {
      return res.status(200).json({ status: 'success', periods: [] });
    }

    // Check validity
    if (!scheduleDoc.isPermanent) {
      const from = new Date(scheduleDoc.validFrom);
      const to = new Date(scheduleDoc.validTo);
      // set hours to 0 to compare dates
      from.setHours(0,0,0,0);
      to.setHours(23,59,59,999);
      if (today < from || today > to) {
        return res.status(200).json({ status: 'success', periods: [] });
      }
    }

    const dayName = getDayName(today);
    const periods = scheduleDoc.schedule[dayName] || [];

    // Sort by period number
    const sortedPeriods = [...periods].sort((a, b) => a.periodNumber - b.periodNumber);

    res.status(200).json({
      status: 'success',
      periods: sortedPeriods
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
