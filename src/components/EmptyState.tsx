import { CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  type: 'dashboard' | 'tasks';
}

export function EmptyState({ type }: EmptyStateProps) {
  if (type === 'dashboard') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-status-upcoming/20 mb-4">
          <CheckCircle2 className="w-8 h-8 text-status-upcoming" />
        </div>
        <h3 className="text-xl font-display font-bold mb-2">All Caught Up!</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          No maintenance tasks are due today or overdue. Great job keeping the workshop in shape!
        </p>
        <Button asChild variant="outline">
          <Link to="/admin">
            <Plus className="w-4 h-4 mr-2" />
            Add New Task
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <Plus className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-display font-bold mb-2">No Tasks Yet</h3>
      <p className="text-muted-foreground max-w-sm">
        Create your first maintenance task to get started tracking workshop maintenance.
      </p>
    </div>
  );
}
