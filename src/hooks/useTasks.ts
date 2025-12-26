import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaintenanceTask, MaintenanceLog } from '@/types/maintenance';
import { toast } from '@/hooks/use-toast';

// API helper functions for PostgreSQL queries
const API_BASE = '/api';

async function fetchFromApi(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  // Gérer les réponses vides ou non-JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON response:', text);
    throw new Error('Invalid JSON response from server');
  }
}

export function useTasks() {
  return useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: async () => {
      return fetchFromApi('/tasks');
    },
  });
}

export function useActiveTasks() {
  return useQuery({
    queryKey: ['active-maintenance-tasks'],
    queryFn: async () => {
      return fetchFromApi('/tasks?active=true');
    },
  });
}

export function useMaintenanceLogs() {
  return useQuery({
    queryKey: ['maintenance-logs'],
    queryFn: async () => {
      return fetchFromApi('/logs');
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
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + task.frequency_days);
      
      const response = await fetchFromApi('/tasks/complete', {
        method: 'POST',
        body: JSON.stringify({
          taskId: task.id,
          completedBy,
          notes: notes || null,
          newDueDate: newDueDate.toISOString().split('T')[0],
        }),
      });
      
      return {
        task: response?.task || task,
        newDueDate
      };
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
        description: error instanceof Error ? error.message : "Failed to complete task. Please try again.",
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
      return fetchFromApi('/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      });
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
      return fetchFromApi(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
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
      return fetchFromApi(`/tasks/${id}`, {
        method: 'DELETE',
      });
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
