import { useState, useRef } from 'react';
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
import { Lock, AlertCircle } from 'lucide-react';

interface AdminPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordSubmit: (password: string) => void;
  onCancel?: () => void;
}

export function AdminPasswordDialog({
  open,
  onOpenChange,
  onPasswordSubmit,
  onCancel,
}: AdminPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const authenticatedRef = useRef(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (password === adminPassword) {
      authenticatedRef.current = true;
      setPassword('');
      setError('');
      onPasswordSubmit(password);
      onOpenChange(false);
    } else {
      setError('Mot de passe incorrect');
      setPassword('');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setPassword('');
      setError('');
      authenticatedRef.current = false;
    } else {
      // Ne naviguer que si on ferme sans succès d'authentification
      if (!authenticatedRef.current) {
        onCancel?.();
      }
      authenticatedRef.current = false;
    }
    onOpenChange(newOpen);
  };

  const handleInteractOutside = (e: Event) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={handleInteractOutside}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Accès administrateur
            </DialogTitle>
            <DialogDescription>
              Entrez le mot de passe pour accéder à la gestion des tâches.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="password" className="font-semibold">
                Mot de passe <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Entrez le mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base"
                required
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!password.trim()}
              className="min-w-[140px]"
            >
              Accéder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
