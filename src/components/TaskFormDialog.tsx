import { useState, useEffect } from 'react';
import { MaintenanceTask } from '@/types/maintenance';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Plus } from 'lucide-react';

interface TaskFormDialogProps {
  task?: MaintenanceTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description: string;
    frequency_days: number;
    next_due_date: string;
    is_active: boolean;
  }) => void;
  isLoading?: boolean;
}

export function TaskFormDialog({
  task,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: TaskFormDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequencyDays, setFrequencyDays] = useState('7');
  const [nextDueDate, setNextDueDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const isEditing = !!task;
  
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setFrequencyDays(task.frequency_days.toString());
      setNextDueDate(task.next_due_date);
      setIsActive(task.is_active);
    } else {
      setTitle('');
      setDescription('');
      setFrequencyDays('7');
      setNextDueDate(new Date().toISOString().split('T')[0]);
      setIsActive(true);
    }
  }, [task, open]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && frequencyDays && nextDueDate) {
      onSubmit({
        title: title.trim(),
        description: description.trim(),
        frequency_days: parseInt(frequencyDays, 10),
        next_due_date: nextDueDate,
        is_active: isActive,
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {isEditing ? 'Edit Task' : 'New Maintenance Task'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the maintenance task details.' 
                : 'Create a new recurring maintenance task.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="title" className="font-semibold">
                Task Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Clean CNC Filter"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12"
                required
                autoFocus
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description" className="font-semibold">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Instructions or details for this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="frequency" className="font-semibold">
                  Frequency (days) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="frequency"
                  type="number"
                  min="1"
                  max="365"
                  placeholder="7"
                  value={frequencyDays}
                  onChange={(e) => setFrequencyDays(e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="dueDate" className="font-semibold">
                  Next Due Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="h-12"
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="active" className="font-semibold cursor-pointer">
                  Active
                </Label>
                <p className="text-sm text-muted-foreground">
                  Inactive tasks won't appear on the dashboard
                </p>
              </div>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !frequencyDays || !nextDueDate || isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
