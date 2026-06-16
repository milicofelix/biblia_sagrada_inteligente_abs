import { BookOpen, CalendarDays, Church, Clock3, Home, Library, PenLine, Settings, Star } from 'lucide-react';

import type { DashboardStats, NavigationItem } from '../../types/dashboard';

const navigationItems: NavigationItem[] = [
    { label: 'Inicio', icon: Home },
    { label: 'Biblia', icon: BookOpen },
    { label: 'Estudos', icon: Library },
    { label: 'Planos de Leitura', icon: CalendarDays },
    { label: 'Diario de Cultos', icon: Church },
    { label: 'Favoritos', icon: Star },
    { label: 'Anotacoes', icon: PenLine },
    { label: 'Historico', icon: Clock3 },
    { label: 'Configuracoes', icon: Settings },
];

type DashboardSidebarProps = {
    stats: DashboardStats;
    activeLabel?: string;
    onNavigate?: (label: string) => void;
};

export function DashboardSidebar({ stats, activeLabel = 'Biblia', onNavigate }: DashboardSidebarProps) {
    return (
        <aside className="bible-sidebar">
            <AppLogo />

            <nav className="bible-nav" aria-label="Principal">
                {navigationItems.map((item) => (
                    <SidebarNavItem
                        key={item.label}
                        item={item}
                        active={item.label === activeLabel}
                        onNavigate={onNavigate}
                    />
                ))}
            </nav>

            <div className="sidebar-note">
                <p>Joao 3:16</p>
                <span>{stats.verses ?? 0} versiculos indexados</span>
            </div>
        </aside>
    );
}

export function AppLogo() {
    return (
        <div className="app-logo">
            <div className="logo-mark">
                <BookOpen className="h-7 w-7" />
            </div>
            <div>
                <strong>BIBLIA</strong>
                <span>INTELIGENTE</span>
            </div>
        </div>
    );
}

function SidebarNavItem({ item, active, onNavigate }: { item: NavigationItem; active: boolean; onNavigate?: (label: string) => void }) {
    const Icon = item.icon;

    return (
        <button
            type="button"
            className={active ? 'active' : ''}
            onClick={() => onNavigate?.(item.label)}
            disabled={item.disabled}
            title={item.disabled ? 'Em breve' : undefined}
        >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
        </button>
    );
}
