const Message = require('../models/Message');
const User = require('../models/User');
// Get messages for chat
exports.getMessages = async (req, res) => {
  try {
    const { role } = req.user;

    if (role === 'parent') {
      // Find the class teacher assigned to this parent's class and section
      const teacher = await User.findOne({
        role: 'teacher',
        school: req.user.school,
        classAssigned: req.user.classAssigned,
        sectionAssigned: req.user.sectionAssigned
      });

      if (!teacher) {
        return res.status(200).json({ status: 'success', messages: [] });
      }

      // Mark teacher's messages to this parent as read
      await Message.updateMany(
        { parent: req.user._id, teacher: teacher._id, sender: 'teacher', read: false },
        { read: true }
      );

      const messages = await Message.find({
        parent: req.user._id,
        teacher: teacher._id
      }).sort({ createdAt: 1 });

      return res.status(200).json({ status: 'success', messages });
    } 

    if (role === 'teacher') {
      const { parentId } = req.query;
      if (!parentId) {
        return res.status(400).json({ status: 'error', message: 'Parent ID is required for teachers' });
      }

      // Mark parent's messages to this teacher as read
      await Message.updateMany(
        { parent: parentId, teacher: req.user._id, sender: 'parent', read: false },
        { read: true }
      );

      const messages = await Message.find({
        parent: parentId,
        teacher: req.user._id
      }).sort({ createdAt: 1 });

      return res.status(200).json({ status: 'success', messages });
    }

    return res.status(403).json({ status: 'error', message: 'Unauthorized role for chat messages' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { role } = req.user;
    const { text, linkToTab } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ status: 'error', message: 'Message text is required' });
    }

    if (role === 'parent') {
      // Find the class teacher
      const teacher = await User.findOne({
        role: 'teacher',
        school: req.user.school,
        classAssigned: req.user.classAssigned,
        sectionAssigned: req.user.sectionAssigned
      });

      if (!teacher) {
        return res.status(404).json({ status: 'error', message: 'No class teacher is currently assigned to your class.' });
      }

      const newMessage = new Message({
        sender: 'parent',
        parent: req.user._id,
        teacher: teacher._id,
        text: text.trim(),
        linkToTab: linkToTab || ''
      });

      await newMessage.save();
      return res.status(201).json({ status: 'success', message: newMessage });
    }

    if (role === 'teacher') {
      const { parentId } = req.body;
      if (!parentId) {
        return res.status(400).json({ status: 'error', message: 'Parent ID is required for teachers' });
      }

      const newMessage = new Message({
        sender: 'teacher',
        parent: parentId,
        teacher: req.user._id,
        text: text.trim(),
        linkToTab: linkToTab || ''
      });

      await newMessage.save();
      return res.status(201).json({ status: 'success', message: newMessage });
    }
    return res.status(403).json({ status: 'error', message: 'Unauthorized role for sending chat messages' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Get unread counts
exports.getUnreadCounts = async (req, res) => {
  try {
    const { role } = req.user;
    if (role === 'parent') {
      const count = await Message.countDocuments({
        parent: req.user._id,
        sender: 'teacher',
        read: false
      });
      return res.status(200).json({ status: 'success', count });
    }
    if (role === 'teacher') {
      const unread = await Message.aggregate([
        {
          $match: {
            teacher: req.user._id,
            sender: 'parent',
            read: false
          }
        },
        {
          $group: {
            _id: '$parent',
            count: { $sum: 1 }
          }
        }
      ]);
      const counts = {};
      unread.forEach(item => {
        counts[item._id.toString()] = item.count;
      });
      return res.status(200).json({ status: 'success', counts });
    }
    return res.status(403).json({ status: 'error', message: 'Unauthorized role' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { role } = req.user;
    if (role === 'parent') {
      await Message.updateMany(
        { parent: req.user._id, sender: 'teacher', read: false },
        { read: true }
      );
      return res.status(200).json({ status: 'success', message: 'Messages marked as read' });
    }
    if (role === 'teacher') {
      const { parentId } = req.body;
      if (!parentId) {
        return res.status(400).json({ status: 'error', message: 'Parent ID is required' });
      }
      await Message.updateMany(
        { parent: parentId, teacher: req.user._id, sender: 'parent', read: false },
        { read: true }
      );
      return res.status(200).json({ status: 'success', message: 'Messages marked as read' });
    }
    return res.status(403).json({ status: 'error', message: 'Unauthorized role' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
