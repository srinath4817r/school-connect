const Diary = require('../models/Diary');
const School = require('../models/School');
const Class = require('../models/Class');
const User = require('../models/User');

// Helper to get start and end of today
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// 1. Get today's diary entry
exports.getTodayDiary = async (req, res) => {
  try {
    let classId = req.query.classId || req.user.classAssigned;
    let section = req.query.section || req.user.sectionAssigned;

    if (!classId || !section) {
      return res.status(200).json({ status: 'success', diary: null, message: 'Class/section not assigned.' });
    }

    const { start, end } = getTodayRange();

    const diary = await Diary.findOne({
      school: req.user.school,
      class: classId,
      section: section.toUpperCase(),
      createdAt: { $gte: start, $lte: end }
    }).populate('teacher', 'fullName');

    // If parent is requesting, automatically log parent view
    if (diary && req.user.role === 'parent') {
      const viewIndex = diary.parentViews.findIndex(v => v.parentId.toString() === req.user._id.toString());
      if (viewIndex === -1) {
        diary.parentViews.push({
          parentId: req.user._id,
          readAt: new Date(),
          markedAsRead: false
        });
        await diary.save();
      }
    }

    res.status(200).json({ status: 'success', diary });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 2. Create or update today's diary (Teacher only)
exports.createOrUpdateDiary = async (req, res) => {
  try {
    const { homework, classwork, reminders, notice, teacherNote } = req.body;
    const classId = req.user.classAssigned;
    const section = req.user.sectionAssigned;

    if (!classId || !section) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'You must have an assigned class and section to create diaries' 
      });
    }

    if (!classwork || !reminders || !notice) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Classwork, reminders, and notice are required' 
      });
    }

    const { start, end } = getTodayRange();

    let diary = await Diary.findOne({
      school: req.user.school,
      class: classId,
      section: section.toUpperCase(),
      createdAt: { $gte: start, $lte: end }
    });

    const homeworkList = Array.isArray(homework) ? homework : [];

    if (diary) {
      // Update existing diary
      diary.homework = homeworkList;
      diary.classwork = classwork;
      diary.reminders = reminders;
      diary.notice = notice;
      diary.teacherNote = teacherNote || '';
      diary.lastEditedAt = new Date();
      diary.submittedAt = Date.now();
      await diary.save();
    } else {
      // Create new diary
      diary = new Diary({
        school: req.user.school,
        class: classId,
        section: section.toUpperCase(),
        teacher: req.user._id,
        homework: homeworkList,
        classwork,
        reminders,
        notice,
        teacherNote: teacherNote || '',
        postedAt: new Date(),
        submittedAt: Date.now()
      });
      await diary.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Diary updated successfully',
      diary
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Toggle parent homework checkmark (Parent only)
exports.toggleHomeworkComplete = async (req, res) => {
  try {
    const { id, subjectIndex } = req.params;
    const parentId = req.user._id;

    const diary = await Diary.findById(id);
    if (!diary) {
      return res.status(404).json({ status: 'error', message: 'Diary entry not found' });
    }

    const homeworkItem = diary.homework[subjectIndex];
    if (!homeworkItem) {
      return res.status(400).json({ status: 'error', message: 'Subject homework not found in diary' });
    }

    const index = homeworkItem.completedByParents.indexOf(parentId);
    if (index > -1) {
      // Unmark complete
      homeworkItem.completedByParents.splice(index, 1);
    } else {
      // Mark complete
      homeworkItem.completedByParents.push(parentId);
    }

    await diary.save();
    res.status(200).json({ status: 'success', diary });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. View history diaries (only return diaries in past 7 days)
exports.getDiaryHistory = async (req, res) => {
  try {
    const classId = req.query.classId || req.user.classAssigned;
    const section = req.query.section || req.user.sectionAssigned;

    if (!classId || !section) {
      return res.status(200).json({ status: 'success', diaries: [] });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const diaries = await Diary.find({
      school: req.user.school,
      class: classId,
      section: section.toUpperCase(),
      createdAt: { $gte: sevenDaysAgo }
    })
      .populate('teacher', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', diaries });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 5. Get school-wide diary submissions (Principal/Admin)
exports.getClassDiaries = async (req, res) => {
  try {
    const diaries = await Diary.find({ school: req.user.school })
      .populate('class', 'name')
      .populate('teacher', 'fullName')
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({ status: 'success', diaries });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 6. Mark diary as read (Parent only)
exports.markDiaryAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = req.user._id;

    const diary = await Diary.findById(id);
    if (!diary) {
      return res.status(404).json({ status: 'error', message: 'Diary not found' });
    }

    let viewEntry = diary.parentViews.find(v => v.parentId.toString() === parentId.toString());
    if (viewEntry) {
      viewEntry.markedAsRead = true;
      viewEntry.readAt = new Date();
    } else {
      diary.parentViews.push({
        parentId: parentId,
        readAt: new Date(),
        markedAsRead: true
      });
    }

    await diary.save();

    res.status(200).json({ 
      status: 'success', 
      message: 'Diary marked as read successfully',
      diary
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// 7. Get parent read status list (Teacher/Admin/Principal)
exports.getDiaryReadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const diary = await Diary.findById(id);
    if (!diary) {
      return res.status(404).json({ status: 'error', message: 'Diary not found' });
    }

    // Find all parents for this school, class, and section
    const parents = await User.find({
      school: diary.school,
      role: 'parent',
      classAssigned: diary.class,
      sectionAssigned: diary.section
    }).select('fullName email');

    const readList = parents.map(parent => {
      const view = diary.parentViews.find(v => v.parentId.toString() === parent._id.toString());
      return {
        parentId: parent._id,
        fullName: parent.fullName,
        email: parent.email,
        readAt: view ? view.readAt : null,
        markedAsRead: view ? view.markedAsRead : false
      };
    });

    const totalCount = parents.length;
    const readCount = readList.filter(p => p.markedAsRead).length;

    res.status(200).json({
      status: 'success',
      totalCount,
      readCount,
      parents: readList
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
