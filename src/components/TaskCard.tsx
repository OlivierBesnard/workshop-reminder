import { MaintenanceTask, getTaskStatus, getDaysUntilDue } from '@/types/maintenance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertTriangle, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: MaintenanceTask;
  onComplete: (task: MaintenanceTask) => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const status = getTaskStatus(task);
  const daysUntilDue = getDaysUntilDue(task);
  
  const statusConfig = {
    overdue: {
      label: `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue`,
      icon: AlertTriangle,
      cardClass: 'task-card-overdue',
      badgeClass: 'bg-destructive/20 text-destructive border-destructive/50',
    },
    'due-today': {
      label: 'Due Today',
      icon: Clock,
      cardClass: 'task-card-due-today',
      badgeClass: 'bg-status-due-today/20 text-status-due-today border-status-due-today/50',
    },
    upcoming: {
      label: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
      icon: CalendarDays,
      cardClass: 'task-card-upcoming',
      badgeClass: 'bg-status-upcoming/20 text-status-upcoming border-status-upcoming/50',
    },
    inactive: {
      label: 'Inactive',
      icon: Clock,
      cardClass: 'border-muted',
      badgeClass: 'bg-muted text-muted-foreground border-muted',
    },
  };
  
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  
  return (
    <Card className={cn(
      'border-2 transition-all duration-200 hover:shadow-lg animate-slide-up',
      config.cardClass,
      status === 'overdue' && 'animate-pulse-glow'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-display leading-tight mb-2">
              {task.title}
            </CardTitle>
            <Badge 
              variant="outline" 
              className={cn('font-mono text-xs', config.badgeClass)}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {task.description && (
          <CardDescription className="text-sm text-muted-foreground leading-relaxed">
            {task.description}
          </CardDescription>
        )}
        
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="text-xs text-muted-foreground font-mono">
            Every {task.frequency_days} day{task.frequency_days !== 1 ? 's' : ''}
          </div>
          
          <Button
            onClick={() => onComplete(task)}
            variant={status === 'overdue' ? 'destructive' : status === 'due-today' ? 'warning' : 'success'}
            size="lg"
            className="font-bold min-w-[140px]"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Mark Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
