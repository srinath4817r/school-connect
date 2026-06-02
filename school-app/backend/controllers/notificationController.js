const Notification = require('../models/Notification');
const User = require('../models/User');

// Get active unread notifications for logged-in user or their role
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    // Find notifications sent directly to user, or broadcasted to their role (or 'all')
    const query = {
      $or: [
        { recipient: userId },
        { recipientRole: userRole },
        { recipientRole: 'all' }
      ],
      isRead: false
    };

    // Filter by school if not super_admin and notification has school assigned
    if (req.user.role !== 'super_admin' && req.user.school) {
      // Allow global notifications (where school is null) or matching school notifications
      query.$and = [
        {
          $or: [
            { school: req.user.school },
            { school: null }
          ]
        }
      ];
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'fullName role')
      .populate('metadata.classId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', notifications });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ status: 'success', message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Broadcast an update details request to a role group
exports.pushUpdateDetailsRequest = async (req, res) => {
  try {
    const { role, message } = req.body;

    if (!role || !message) {
      return res.status(400).json({ status: 'error', message: 'Recipient role and message are required' });
    }

    if (!['parent', 'teacher', 'driver', 'staff'].includes(role)) {
      return res.status(400).json({ status: 'error', message: 'Invalid recipient role' });
    }

    let targetSchoolId = req.user.school;
    if (req.user.role === 'super_admin') {
      targetSchoolId = req.body.schoolId || null;
    }

    const newNotification = new Notification({
      school: targetSchoolId,
      sender: req.user._id,
      recipientRole: role,
      type: 'update_details',
      message
    });

    await newNotification.save();

    res.status(201).json({ 
      status: 'success', 
      message: `Successfully broadcast details update request to all ${role}s.` 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
