const cron = require('node-cron');
const Diary = require('../models/Diary');
const User = require('../models/User');
const School = require('../models/School');
const { sendPushNotification, notifyParentsOfClass } = require('./notifications');

// Helper to get date bounds for today (local India time helper)
const getTodayBounds = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
};


/**
 * 2. Daily cleanup of diaries older than 7 days.
 */
const startDiaryCleanupCron = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running 7-day Diary cleanup...');
    try {
      const expirationTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const result = await Diary.deleteMany({ createdAt: { $lt: expirationTime } });
      console.log(`[CRON] Deleted ${result.deletedCount} old diaries.`);
    } catch (error) {
      console.error(`[CRON] Error in Diary cleanup cron: ${error.message}`);
    }
  });
};

/**
 * 3. Time-based Diary Alert System:
 * - 3:00 PM: Alert teachers (Diary opens in 30m)
 * - 3:15 PM: Alert teachers (Diary opens in 15m)
 * - 3:30 PM: Unlock Diary & notify teachers
 * - 4:00 PM: Alert teachers who haven't submitted yet (30m left)
 * - 4:15 PM: Alert teachers who haven't submitted yet (15m left)
 * - 4:30 PM: Lock Diary, notify parents of submitted classes, warn missed teachers & principals.
 */
const initCronJobs = () => {
  startDiaryCleanupCron();
  console.log('[CRON] All system schedulers and cron jobs initialized successfully.');
};

module.exports = { initCronJobs };
