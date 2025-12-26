import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceTask, MaintenanceLog } from '@/types/maintenance';
import { toast } from '@/hooks/use-toast';

export function useTasks() {
  return useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .order('next_due_date', { ascending: true });
      
      if (error) throw error;
      return data as MaintenanceTask[];
    },
  });
}

export function useActiveTasks() {
  return useQuery({
    queryKey: ['active-maintenance-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('is_active', true)
        .order('next_due_date', { ascending: true });
      
      if (error) throw error;
      return data as MaintenanceTask[];
    },
  });
}

export function useMaintenanceLogs() {
  return useQuery({
    queryKey: ['maintenance-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select(`
          *,
          maintenance_tasks (
            id,
            title
          )
        `)
        .order('completed_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as MaintenanceLog[];
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      task, 
      completedBy, 
      notes 
    }: { 
      task: MaintenanceTask; 
      completedBy: string; 
      notes?: string;
    }) => {
      // Create the log entry
      const { error: logError } = await supabase
        .from('maintenance_logs')
        .insert({
          task_id: task.id,
          completed_by: completedBy,
          notes: notes || null,
        });
      
      if (logError) throw logError;
      
      // Calculate new due date
      const today = new Date();
      const newDueDate = new Date(today);
      newDueDate.setDate(newDueDate.getDate() + task.frequency_days);
      
      // Update the task's next_due_date
      const { error: updateError } = await supabase
        .from('maintenance_tasks')
        .update({ next_due_date: newDueDate.toISOString().split('T')[0] })
        .eq('id', task.id);
      
      if (updateError) throw updateError;
      
      return { task, newDueDate };
    },
    onSuccess: ({ task, newDueDate }) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['active-maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
      
      toast({
        title: "Task Completed",
        description: `"${task.title}" marked as done. Next due: ${newDueDate.toLocaleDateString()}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
      console.error('Error completing task:', error);
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (task: Omit<MaintenanceTask, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .insert(task)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['active-maintenance-tasks'] });
      toast({
        title: "Task Created",
        description: "New maintenance task has been added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating task:', error);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MaintenanceTask> & { id: string }) => {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['active-maintenance-tasks'] });
      toast({
        title: "Task Updated",
        description: "Maintenance task has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating task:', error);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maintenance_tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['active-maintenance-tasks'] });
      toast({
        title: "Task Deleted",
        description: "Maintenance task has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting task:', error);
    },
  });
}
