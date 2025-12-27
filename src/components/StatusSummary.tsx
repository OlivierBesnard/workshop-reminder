import { MaintenanceTask, getTaskStatus } from '@/types/maintenance';
import { AlertTriangle, Clock, CalendarCheck } from 'lucide-react';

interface StatusSummaryProps {
  tasks: MaintenanceTask[];
}

export function StatusSummary({ tasks }: StatusSummaryProps) {
  const activeTasks = tasks.filter(t => t.is_active);
  const overdueTasks = activeTasks.filter(t => getTaskStatus(t) === 'overdue');
  const dueTodayTasks = activeTasks.filter(t => getTaskStatus(t) === 'due-today');
  const upcomingTasks = activeTasks.filter(t => getTaskStatus(t) === 'upcoming');
  
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border-2 border-destructive/30">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/20">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-destructive">
            {overdueTasks.length}
          </p>
          <p className="text-xs text-muted-foreground font-medium">En retard</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-4 rounded-lg bg-status-due-today/10 border-2 border-status-due-today/30">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-status-due-today/20">
          <Clock className="w-5 h-5 text-status-due-today" />
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-status-due-today">
            {dueTodayTasks.length}
          </p>
          <p className="text-xs text-muted-foreground font-medium">Échéance aujourd'hui</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-4 rounded-lg bg-status-upcoming/10 border-2 border-status-upcoming/30">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-status-upcoming/20">
          <CalendarCheck className="w-5 h-5 text-status-upcoming" />
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-status-upcoming">
            {upcomingTasks.length}
          </p>
          <p className="text-xs text-muted-foreground font-medium">À venir</p>
        </div>
      </div>
    </div>
  );
}
