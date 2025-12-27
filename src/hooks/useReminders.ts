import { useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export function useSendOverdueReminders() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`${API_URL}/api/tasks/send-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to send reminders');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reminders Sent",
        description: `${data.remindersSent} email reminder(s) sent for overdue tasks.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send reminders. Please try again.",
        variant: "destructive",
      });
      console.error('Error sending reminders:', error);
    },
  });
}

export function useGetOverdueTasks() {
  return fetch(`${API_URL}/api/tasks/overdue`)
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch overdue tasks');
      return res.json();
    })
    .catch((error) => {
      console.error('Error fetching overdue tasks:', error);
      return [];
    });
}
