import cron from 'node-cron';
import pool from './db';
import { sendOverdueTaskReminder } from './brevo';
import { MaintenanceTask } from '../src/types/maintenance';

let schedulerRunning = false;

export async function sendOverdueReminders(email?: string): Promise<void> {
  try {
    // Get the admin email from environment or use the one provided
    const reminderEmail = email || process.env.BREVO_RECIPIENT_EMAIL;

    if (!reminderEmail) {
      console.warn('[Scheduler] No email configured for reminders');
      return;
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get overdue tasks
    const result = await pool.query(
      `SELECT * FROM maintenance_tasks 
       WHERE is_active = true AND next_due_date < $1
       ORDER BY next_due_date ASC`,
      [today.toISOString()]
    );

    const overdueTasks = result.rows as MaintenanceTask[];
    let remindersCount = 0;

    console.log(`[Scheduler] Found ${overdueTasks.length} overdue task(s)`);

    for (const task of overdueTasks) {
      const dueDate = new Date(task.next_due_date);
      const daysOverdue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if already sent reminder today
      const reminderCheck = await pool.query(
        `SELECT * FROM email_reminders 
         WHERE task_id = $1 AND DATE(sent_at) = $2`,
        [task.id, today.toISOString().split('T')[0]]
      );

      if (reminderCheck.rows.length === 0) {
        const emailSent = await sendOverdueTaskReminder(
          reminderEmail,
          task.title,
          daysOverdue
        );

        if (emailSent) {
          // Record the reminder
          await pool.query(
            `INSERT INTO email_reminders (task_id, recipient_email, days_overdue)
             VALUES ($1, $2, $3)`,
            [task.id, reminderEmail, daysOverdue]
          );
          remindersCount++;
          console.log(`[Scheduler] Reminder sent for task: ${task.title}`);
        }
      } else {
        console.log(
          `[Scheduler] Reminder already sent today for task: ${task.title}`
        );
      }
    }

    console.log(
      `[Scheduler] Task completed: ${remindersCount} reminder(s) sent at ${new Date().toISOString()}`
    );
  } catch (error) {
    console.error('[Scheduler] Error sending reminders:', error);
  }
}

/**
 * Start the scheduler that runs at 8:00 AM every day
 * Cron expression: '0 8 * * *' means:
 * - 0: minute
 * - 8: hour (8 AM)
 * - *: day of month (every day)
 * - *: month (every month)
 * - *: day of week (every day)
 */
export function startScheduler(): void {
  if (schedulerRunning) {
    console.log('[Scheduler] Scheduler is already running');
    return;
  }

  const cronExpression = process.env.REMINDER_CRON || '0 8 * * *';
  const email = process.env.BREVO_RECIPIENT_EMAIL;

  if (!email) {
    console.warn(
      '[Scheduler] BREVO_RECIPIENT_EMAIL not configured. Scheduler will not send reminders.'
    );
  }

  console.log(
    `[Scheduler] Starting scheduler with cron expression: ${cronExpression}`
  );

  cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] Running scheduled task at ${new Date().toISOString()}`);
    await sendOverdueReminders(email);
  });

  schedulerRunning = true;
  console.log('[Scheduler] Scheduler started successfully');
}

export function stopScheduler(): void {
  // node-cron doesn't expose a stop method globally, but we track the state
  schedulerRunning = false;
  console.log('[Scheduler] Scheduler stopped');
}

export function isSchedulerRunning(): boolean {
  return schedulerRunning;
}
