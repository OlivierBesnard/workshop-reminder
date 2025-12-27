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
        <h3 className="text-xl font-display font-bold mb-2">Tout est à jour !</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Aucune tâche de maintenance n'est due aujourd'hui ou en retard. Excellent travail pour maintenir l'atelier en bon état !
        </p>
        <Button asChild variant="outline">
          <Link to="/admin">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une nouvelle tâche
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
      <h3 className="text-xl font-display font-bold mb-2">Aucune tâche encore</h3>
      <p className="text-muted-foreground max-w-sm">
        Créez votre première tâche de maintenance pour commencer à suivre la maintenance de l'atelier.
      </p>
    </div>
  );
}
