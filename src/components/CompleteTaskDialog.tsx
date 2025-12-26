import { useState } from 'react';
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
import { CheckCircle2, Loader2 } from 'lucide-react';

interface CompleteTaskDialogProps {
  task: MaintenanceTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (completedBy: string, notes?: string) => void;
  isLoading?: boolean;
}

export function CompleteTaskDialog({
  task,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: CompleteTaskDialogProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim(), notes.trim() || undefined);
      setName('');
      setNotes('');
    }
  };
  
  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setName('');
      setNotes('');
    }
    onOpenChange(newOpen);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Complete Task</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {task?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-semibold">
                Your Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-base"
                required
                autoFocus
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes" className="font-semibold">
                Notes <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Any remarks or observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              size="lg"
              disabled={!name.trim() || isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
