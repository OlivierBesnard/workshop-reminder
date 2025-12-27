import { useState } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { MaintenanceTask, getTaskStatus } from '@/types/maintenance';
import { Header } from '@/components/Header';
import { TaskFormDialog } from '@/components/TaskFormDialog';
import { AdminPasswordDialog } from '@/components/AdminPasswordDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Admin() {
  const { data: tasks, isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<MaintenanceTask | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  
  const handleCreate = () => {
    if (!isAdminAuthenticated) {
      setShowPasswordDialog(true);
      return;
    }
    setEditingTask(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (task: MaintenanceTask) => {
    if (!isAdminAuthenticated) {
      setShowPasswordDialog(true);
      return;
    }
    setEditingTask(task);
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = (data: {
    title: string;
    description: string;
    frequency_days: number;
    next_due_date: string;
    is_active: boolean;
  }) => {
    if (editingTask) {
      updateTask.mutate(
        { id: editingTask.id, ...data },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createTask.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };
  
  const handleToggleActive = (task: MaintenanceTask) => {
    if (!isAdminAuthenticated) {
      setShowPasswordDialog(true);
      return;
    }
    updateTask.mutate({ id: task.id, is_active: !task.is_active });
  };
  
  const handleConfirmDelete = () => {
    if (!isAdminAuthenticated) {
      setShowPasswordDialog(true);
      return;
    }
    if (deletingTask) {
      deleteTask.mutate(deletingTask.id, {
        onSuccess: () => setDeletingTask(null),
      });
    }
  };
  
  const statusBadgeClass = (task: MaintenanceTask) => {
    if (!task.is_active) return 'bg-muted text-muted-foreground';
    const status = getTaskStatus(task);
    switch (status) {
      case 'overdue':
        return 'bg-destructive/20 text-destructive border-destructive/50';
      case 'due-today':
        return 'bg-status-due-today/20 text-status-due-today border-status-due-today/50';
      case 'upcoming':
        return 'bg-status-upcoming/20 text-status-upcoming border-status-upcoming/50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (task: MaintenanceTask): string => {
    if (!task.is_active) return 'Inactif';
    const status = getTaskStatus(task);
    const statusLabels: Record<string, string> = {
      'overdue': 'En retard',
      'due-today': 'Échéance aujourd\'hui',
      'upcoming': 'À venir',
      'inactive': 'Inactif'
    };
    return statusLabels[status] || status;
  };
  
  return (
    <div className="min-h-screen bg-background industrial-grid">
      <Header />
      
      <main className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Gérer les tâches</h2>
            <p className="text-muted-foreground">
              Créer et configurer les calendriers de maintenance
            </p>
          </div>
          <Button onClick={handleCreate} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Ajouter une tâche
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="rounded-lg border-2 border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                  <TableHead className="font-display font-bold">Tâche</TableHead>
                  <TableHead className="font-display font-bold hidden sm:table-cell">Fréquence</TableHead>
                  <TableHead className="font-display font-bold">Date d'échéance</TableHead>
                  <TableHead className="font-display font-bold">Statut</TableHead>
                  <TableHead className="font-display font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map(task => (
                  <TableRow key={task.id} className={cn(!task.is_active && 'opacity-60')}>
                    <TableCell>
                      <div className="font-semibold">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {task.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono">
                      {task.frequency_days} jours
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {new Date(task.next_due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeClass(task)}>
                        {getStatusLabel(task)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(task)}
                          title={task.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {task.is_active ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4 text-status-upcoming" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(task)}
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingTask(task)}
                          className="hover:text-destructive"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState type="tasks" />
        )}
      </main>
      
      <TaskFormDialog
        task={editingTask}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={createTask.isPending || updateTask.isPending}
      />
      
      <AlertDialog open={!!deletingTask} onOpenChange={(open) => !open && setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la tâche</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer « {deletingTask?.title} » ? Cela supprimera également tous les journaux de maintenance associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onPasswordSubmit={() => setIsAdminAuthenticated(true)}
      />
    </div>
  );
}
