import { useMaintenanceLogs } from '@/hooks/useTasks';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, User, Clock, FileText } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function History() {
  const { data: logs, isLoading } = useMaintenanceLogs();
  
  return (
    <div className="min-h-screen bg-background industrial-grid">
      <Header />
      
      <main className="container py-6 space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Maintenance History</h2>
          <p className="text-muted-foreground">
            Record of all completed maintenance tasks
          </p>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="rounded-lg border-2 border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                  <TableHead className="font-display font-bold">Task</TableHead>
                  <TableHead className="font-display font-bold">Completed By</TableHead>
                  <TableHead className="font-display font-bold hidden sm:table-cell">Date</TableHead>
                  <TableHead className="font-display font-bold hidden md:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-status-upcoming flex-shrink-0" />
                        <span className="font-semibold">
                          {log.maintenance_tasks?.title || 'Unknown Task'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>{log.completed_by}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <div className="font-mono text-sm">
                            {format(new Date(log.completed_at), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.completed_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {log.notes ? (
                        <div className="flex items-start gap-2 max-w-[300px]">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground truncate">
                            {log.notes}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">No History Yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Completed maintenance tasks will appear here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
