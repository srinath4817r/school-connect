const { messaging } = require('../config/firebase');
const User = require('../models/User');

/**
 * Sends a push notification to a list of devices using Firebase FCM.
 * Falls back to logging if Firebase is not fully configured.
 * 
 * @param {string|string[]} tokens - Single device token or array of device tokens.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body text.
 * @param {object} [data] - Optional metadata payload.
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
  const tokenList = Array.isArray(tokens) ? tokens : [tokens];
  
  // Clean empty/invalid tokens
  const validTokens = tokenList.filter(token => typeof token === 'string' && token.trim().length > 0);
  
  console.log(`\n==========================================`);
  console.log(`[PUSH NOTIFICATION ALERT]`);
  console.log(`Title: ${title}`);
  console.log(`Body: ${body}`);
  console.log(`Payload:`, data);
  console.log(`Targeting ${validTokens.length} device tokens.`);
  console.log(`==========================================\n`);

  if (validTokens.length === 0) return;

  if (messaging) {
    try {
      // Send message to each token
      // Note: Admin SDK sendEachForMulticast is ideal for multiple tokens
      const message = {
        notification: { title, body },
        data: data || {},
        tokens: validTokens
      };

      const response = await messaging.sendEachForMulticast(message);
      console.log(`FCM Multicast sent successfully: ${response.successCount} success, ${response.failureCount} fail`);
    } catch (error) {
      console.error(`FCM sending failed: ${error.message}`);
    }
  } else {
    console.warn(`Warning: Push notification skipped because Firebase Admin messaging is not initialized.`);
  }
};

/**
 * Sends a notification to all parents of a specific class and section.
 */
const notifyParentsOfClass = async (schoolId, classId, section, title, body, data = {}) => {
  try {
    // 1. Find all parent users in this class and section
    // In our system, parents are associated with their child's class and section
    const parents = await User.find({
      school: schoolId,
      role: 'parent',
      classAssigned: classId,
      sectionAssigned: section
    });

    if (parents.length === 0) {
      console.log(`No parents registered for Class: ${classId}, Section: ${section}. Notification skipped.`);
      return;
    }

    // 2. Collect FCM tokens
    // We assume the user schema stores active device tokens or token arrays.
    // For simplicity, let's look for user.deviceTokens or user.fcmToken.
    // Let's support both: user.fcmToken and logging notifications.
    const tokens = [];
    parents.forEach(parent => {
      // Look for custom fields, for now we will support mock tokens or log them
      if (parent.fcmToken) {
        tokens.push(parent.fcmToken);
      }
    });

    const parentNames = parents.map(p => p.fullName).join(', ');
    console.log(`Notifying parents: [${parentNames}] about: "${title}"`);

    // In local development, we always log notification and simulate receipt
    await sendPushNotification(tokens, title, body, {
      ...data,
      classId: classId.toString(),
      section
    });

  } catch (error) {
    console.error(`Failed to notify parents: ${error.message}`);
  }
};

module.exports = {
  sendPushNotification,
  notifyParentsOfClass
};
