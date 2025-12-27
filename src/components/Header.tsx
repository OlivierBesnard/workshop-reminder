import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wrench, LayoutDashboard, Settings, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const location = useLocation();
  
  const navItems = [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/admin', label: 'Gérer', icon: Settings },
    { to: '/history', label: 'Historique', icon: History },
  ];
  
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Wrench className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-display font-bold tracking-tight">
              Gestionnaire d'Atelier
            </h1>
            <p className="text-xs text-muted-foreground -mt-0.5">
              Suivi des Maintenances
            </p>
          </div>
        </Link>
        
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.to}
                asChild
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'font-semibold',
                  isActive && 'bg-secondary border border-border'
                )}
              >
                <Link to={item.to}>
                  <Icon className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
