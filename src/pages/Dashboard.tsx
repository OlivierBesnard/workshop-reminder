import { useState } from 'react';
import { useActiveTasks, useCompleteTask } from '@/hooks/useTasks';
import { MaintenanceTask, getTaskStatus } from '@/types/maintenance';
import { Header } from '@/components/Header';
import { TaskCard } from '@/components/TaskCard';
import { CompleteTaskDialog } from '@/components/CompleteTaskDialog';
import { StatusSummary } from '@/components/StatusSummary';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: tasks, isLoading } = useActiveTasks();
  const completeTask = useCompleteTask();
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  
  const handleComplete = (task: MaintenanceTask) => {
    setSelectedTask(task);
  };
  
  const handleConfirmComplete = (completedBy: string, notes?: string) => {
    if (selectedTask) {
      completeTask.mutate(
        { task: selectedTask, completedBy, notes },
        {
          onSuccess: () => {
            setSelectedTask(null);
          },
        }
      );
    }
  };
  
  // Filter and sort tasks: overdue first, then due today, then upcoming
  const prioritizedTasks = tasks
    ?.filter(task => {
      const status = getTaskStatus(task);
      return status === 'overdue' || status === 'due-today' || status === 'upcoming';
    })
    .sort((a, b) => {
      const statusOrder = { overdue: 0, 'due-today': 1, upcoming: 2, inactive: 3 };
      const aStatus = getTaskStatus(a);
      const bStatus = getTaskStatus(b);
      
      if (statusOrder[aStatus] !== statusOrder[bStatus]) {
        return statusOrder[aStatus] - statusOrder[bStatus];
      }
      
      return new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime();
    }) || [];
  
  // Get urgent tasks (overdue and due today)
  const urgentTasks = prioritizedTasks.filter(t => {
    const status = getTaskStatus(t);
    return status === 'overdue' || status === 'due-today';
  });
  
  // Get upcoming tasks
  const upcomingTasks = prioritizedTasks.filter(t => getTaskStatus(t) === 'upcoming');
  
  return (
    <div className="min-h-screen bg-background industrial-grid">
      <Header />
      
      <main className="container py-6 space-y-6">
        {/* Status Summary */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <StatusSummary tasks={tasks} />
        ) : null}
        
        {/* Urgent Tasks Section */}
        <section>
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            Nécessite une attention
          </h2>
          
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : urgentTasks.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {urgentTasks.map(task => (
                <TaskCard key={task.id} task={task} onComplete={handleComplete} />
              ))}
            </div>
          ) : (
            <EmptyState type="dashboard" />
          )}
        </section>
        
        {/* Upcoming Tasks Section */}
        {upcomingTasks.length > 0 && (
          <section>
            <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-upcoming" />
              Tâches à venir
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingTasks.map(task => (
                <TaskCard key={task.id} task={task} onComplete={handleComplete} />
              ))}
            </div>
          </section>
        )}
      </main>
      
      <CompleteTaskDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onConfirm={handleConfirmComplete}
        isLoading={completeTask.isPending}
      />
    </div>
  );
}
