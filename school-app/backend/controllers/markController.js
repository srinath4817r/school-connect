const Mark = require('../models/Mark');
const User = require('../models/User');
const Notification = require('../models/Notification');

// 1. Submit student exam marks (Teacher only)
exports.submitMarks = async (req, res) => {
  try {
    const { marksData } = req.body;
    const classId = req.user.classAssigned;
    const section = req.user.sectionAssigned;

    if (!classId || !section) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'You must have an assigned class and section to post grades' 
      });
    }

    if (!Array.isArray(marksData) || marksData.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No marks data provided' });
    }

    // Get list of all students in class
    const students = await User.find({ 
      school: req.user.school, 
      classAssigned: classId, 
      sectionAssigned: section.toUpperCase(), 
      role: 'parent' 
    });

    const studentIds = students.map(s => s._id.toString());

    for (const record of marksData) {
      const { studentId, subject, examName, marksObtained, totalMarks } = record;

      if (!studentIds.includes(studentId)) continue; // ignore non-class students

      // Upsert record (match student, subject, examName)
      await Mark.findOneAndUpdate(
        {
          student: studentId,
          subject,
          examName
        },
        {
          student: studentId,
          school: req.user.school,
          class: classId,
          section: section.toUpperCase(),
          subject,
          examName,
          marksObtained: Number(marksObtained),
          totalMarks: Number(totalMarks)
        },
        { upsert: true, new: true, runValidators: true }
      );

      // Create Parent Notification for Marks
      try {
        const parent = students.find(s => s._id.toString() === studentId);
        const studentName = parent ? parent.fullName : 'Your child';
        const percentage = Math.round((Number(marksObtained) / Number(totalMarks)) * 100);
        const message = `Results Update: New marks published for ${studentName} in ${subject} (${examName}). Scored: ${marksObtained}/${totalMarks} (${percentage}%).`;

        const newNotification = new Notification({
          school: req.user.school,
          sender: req.user._id,
          recipient: studentId,
          type: 'general',
          message,
          metadata: {
            classId,
            section: section.toUpperCase(),
            date: new Date()
          }
        });
        await newNotification.save();
      } catch (err) {
        console.error('Failed to create marks parent notification:', err);
      }
    }

    res.status(200).json({ status: 'success', message: 'Exam marks recorded successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 2. Get child's report card marks (Parent only)
exports.getStudentMarks = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Fetch student marks
    const marks = await Mark.find({ student: studentId })
      .sort({ createdAt: -1 });

    // Fetch averages for each subject/exam of this class to provide comparison context
    let comparisonMarks = [];
    if (req.user.classAssigned && req.user.sectionAssigned) {
      comparisonMarks = await Mark.find({ 
        class: req.user.classAssigned, 
        section: req.user.sectionAssigned 
      });
    }

    // Compute averages
    const subjectAverages = {};
    comparisonMarks.forEach(m => {
      const key = `${m.subject}_${m.examName}`;
      if (!subjectAverages[key]) {
        subjectAverages[key] = { totalObtained: 0, totalMax: 0, count: 0 };
      }
      subjectAverages[key].totalObtained += m.marksObtained;
      subjectAverages[key].totalMax += m.totalMarks;
      subjectAverages[key].count += 1;
    });

    const marksWithAverages = marks.map(m => {
      const key = `${m.subject}_${m.examName}`;
      const avgData = subjectAverages[key];
      const classAvgPercent = avgData && avgData.count > 0 
        ? Math.round(((avgData.totalObtained / avgData.count) / (avgData.totalMax / avgData.count)) * 100) 
        : 0;

      return {
        ...m.toObject(),
        classAveragePercentage: classAvgPercent,
        myPercentage: Math.round((m.marksObtained / m.totalMarks) * 100)
      };
    });

    res.status(200).json({
      status: 'success',
      reportCard: marksWithAverages
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Get marks for a specific class (Teacher / Principal / Admin)
exports.getClassMarks = async (req, res) => {
  try {
    const classId = req.query.classId || req.user.classAssigned;
    const section = req.query.section || req.user.sectionAssigned;
    const subject = req.query.subject;
    const examName = req.query.examName;

    if (!classId || !section) {
      return res.status(400).json({ status: 'error', message: 'Class and section are required' });
    }

    let query = {
      school: req.user.school,
      class: classId,
      section: section.toUpperCase()
    };

    if (subject) query.subject = subject;
    if (examName) query.examName = examName;

    const marksRecords = await Mark.find(query)
      .populate('student', 'fullName email')
      .sort({ subject: 1, examName: 1 });

    res.status(200).json({ status: 'success', marks: marksRecords });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Get school performance stats (Principal / Admin)
exports.getSchoolPerformanceStats = async (req, res) => {
  try {
    const schoolId = req.user.school;

    // Fetch all marks for this school
    const marks = await Mark.find({ school: schoolId });

    if (marks.length === 0) {
      return res.status(200).json({
        status: 'success',
        stats: {
          averagePercentage: 0,
          totalGradesCount: 0,
          passRate: 100
        }
      });
    }

    let totalPercentSum = 0;
    let passCount = 0;
    marks.forEach(m => {
      const pct = (m.marksObtained / m.totalMarks) * 100;
      totalPercentSum += pct;
      if (m.grade !== 'F') passCount += 1;
    });

    const averagePercentage = Math.round(totalPercentSum / marks.length);
    const passRate = Math.round((passCount / marks.length) * 100);

    res.status(200).json({
      status: 'success',
      stats: {
        averagePercentage,
        totalGradesCount: marks.length,
        passRate
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
