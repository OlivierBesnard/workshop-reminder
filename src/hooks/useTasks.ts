import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaintenanceTask, MaintenanceLog } from '@/types/maintenance';
import { toast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://52.47.190.29:3002';

export function useTasks() {
  return useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/tasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json() as Promise<MaintenanceTask[]>;
    },
  });
}

export function useActiveTasks() {
  return useQuery({
    queryKey: ['active-maintenance-tasks'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/tasks/active`);
      if (!response.ok) throw new Error('Failed to fetch active tasks');
      return response.json() as Promise<MaintenanceTask[]>;
    },
  });
}

export function useMaintenanceLogs() {
  return useQuery({
    queryKey: ['maintenance-logs'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/logs`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json() as Promise<MaintenanceLog[]>;
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
      const response = await fetch(`${API_URL}/api/tasks/${task.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedBy, notes: notes || null }),
      });

      if (!response.ok) throw new Error('Failed to complete task');
      const result = await response.json();
      return { task, newDueDate: new Date(result.newDueDate) };
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
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      if (!response.ok) throw new Error('Failed to create task');
      return response.json() as Promise<MaintenanceTask>;
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
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update task');
      return response.json() as Promise<MaintenanceTask>;
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
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');
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
