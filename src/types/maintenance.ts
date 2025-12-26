export interface MaintenanceTask {
  id: string;
  title: string;
  description: string | null;
  frequency_days: number;
  next_due_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceLog {
  id: string;
  task_id: string;
  completed_by: string;
  completed_at: string;
  notes: string | null;
  maintenance_tasks?: MaintenanceTask;
}

export type TaskStatus = 'overdue' | 'due-today' | 'upcoming' | 'inactive';

export function getTaskStatus(task: MaintenanceTask): TaskStatus {
  if (!task.is_active) return 'inactive';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(task.next_due_date);
  dueDate.setHours(0, 0, 0, 0);
  
  if (dueDate < today) return 'overdue';
  if (dueDate.getTime() === today.getTime()) return 'due-today';
  return 'upcoming';
}

export function getDaysUntilDue(task: MaintenanceTask): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(task.next_due_date);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
