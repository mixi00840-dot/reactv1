const cron = require('node-cron');
const schedulingService = require('../services/schedulingService');

// Process scheduled content every minute
const scheduledContentJob = cron.schedule('* * * * *', async () => {
  try {
    console.log('Running scheduled content processor...');
    const result = await schedulingService.processScheduledContent();
    console.log(`Processed ${result.processed} scheduled items. Success: ${result.successful}, Failed: ${result.failed}`);
  } catch (error) {
    console.error('Error in scheduled content job:', error);
  }
});

// Send reminders for upcoming livestreams every 10 minutes
const livestreamReminderJob = cron.schedule('*/10 * * * *', async () => {
  try {
    console.log('Sending livestream reminders...');
    const result = await schedulingService.sendScheduledReminders();
    console.log(`Sent ${result.remindersSent} livestream reminders`);
  } catch (error) {
    console.error('Error in livestream reminder job:', error);
  }
});

module.exports = {
  scheduledContentJob,
  livestreamReminderJob
};
