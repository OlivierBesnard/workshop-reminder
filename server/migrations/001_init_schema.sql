-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create maintenance_tasks table
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  frequency_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  next_due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create maintenance_logs table
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES maintenance_tasks(id),
  completed_by VARCHAR(255) NOT NULL,
  notes TEXT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_task_id ON maintenance_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_is_active ON maintenance_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_next_due_date ON maintenance_tasks(next_due_date);
