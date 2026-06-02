const ClassRequest = require('../models/ClassRequest');
const Class = require('../models/Class');
const User = require('../models/User');

exports.createClassRequest = async (req, res) => {
  try {
    const { className, section, classTeacher } = req.body;
    if (!className || !section || !classTeacher) {
      return res.status(400).json({ status: 'error', message: 'Class name, section, and class teacher are required' });
    }

    if (!req.user.school) {
      return res.status(400).json({ status: 'error', message: 'You must be associated with a school to make this request' });
    }

    // Verify teacher exists and belongs to the same school
    const teacher = await User.findById(classTeacher);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(400).json({ status: 'error', message: 'Invalid class teacher specified' });
    }
    if (teacher.school.toString() !== req.user.school.toString()) {
      return res.status(400).json({ status: 'error', message: 'Teacher must belong to your school' });
    }

    const classRequest = new ClassRequest({
      school: req.user.school,
      className: className.trim(),
      section: section.trim().toUpperCase(),
      classTeacher,
      requester: req.user._id
    });

    await classRequest.save();

    res.status(201).json({ status: 'success', message: 'Class request submitted successfully', classRequest });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getClassRequests = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'super_admin') {
      // Super admin can see all
      query = {};
    } else if (['school_admin', 'principal'].includes(req.user.role)) {
      // Admins/Principals see all requests for their school
      query = { school: req.user.school };
    } else {
      // Teachers/Parents see only what they requested
      query = { requester: req.user._id };
    }

    const requests = await ClassRequest.find(query)
      .populate('classTeacher', 'fullName email')
      .populate('requester', 'fullName email role')
      .populate('school', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', requests });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.approveClassRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const classRequest = await ClassRequest.findById(id);
    if (!classRequest) {
      return res.status(404).json({ status: 'error', message: 'Class request not found' });
    }

    // Verify school matches
    if (req.user.role !== 'super_admin' && classRequest.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: You cannot approve requests for another school' });
    }

    // Create or find Class
    let classRecord = await Class.findOne({ school: classRequest.school, name: classRequest.className });
    if (!classRecord) {
      classRecord = new Class({
        school: classRequest.school,
        name: classRequest.className,
        sections: [classRequest.section]
      });
      await classRecord.save();
    } else {
      if (!classRecord.sections.includes(classRequest.section)) {
        classRecord.sections.push(classRequest.section);
        await classRecord.save();
      }
    }

    // Update teacher's assignment
    const teacher = await User.findById(classRequest.classTeacher);
    if (teacher) {
      teacher.classAssigned = classRecord._id;
      teacher.sectionAssigned = classRequest.section;
      await teacher.save();
    }

    classRequest.status = 'approved';
    await classRequest.save();

    res.status(200).json({ status: 'success', message: 'Class request approved successfully', classRequest });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.rejectClassRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const classRequest = await ClassRequest.findById(id);
    if (!classRequest) {
      return res.status(404).json({ status: 'error', message: 'Class request not found' });
    }

    // Verify school matches
    if (req.user.role !== 'super_admin' && classRequest.school.toString() !== req.user.school.toString()) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: You cannot reject requests for another school' });
    }

    classRequest.status = 'rejected';
    await classRequest.save();

    res.status(200).json({ status: 'success', message: 'Class request rejected', classRequest });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
