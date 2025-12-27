-- Create email_reminders table to track sent reminders
CREATE TABLE IF NOT EXISTS email_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES maintenance_tasks(id),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recipient_email VARCHAR(255) NOT NULL,
  days_overdue INTEGER NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_reminders_task_id ON email_reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_email_reminders_sent_at ON email_reminders(sent_at);
