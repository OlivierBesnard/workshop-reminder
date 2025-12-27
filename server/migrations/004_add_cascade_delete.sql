-- Add CASCADE delete to email_reminders foreign key
ALTER TABLE email_reminders 
DROP CONSTRAINT email_reminders_task_id_fkey;

ALTER TABLE email_reminders 
ADD CONSTRAINT email_reminders_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id) ON DELETE CASCADE;
