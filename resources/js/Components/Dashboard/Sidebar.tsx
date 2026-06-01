import { BookOpen, CalendarDays, Clock3, Home, Library, PenLine, Settings, Star } from 'lucide-react';

import type { DashboardStats, NavigationItem } from '../../types/dashboard';

const navigationItems: NavigationItem[] = [
    { label: 'Inicio', icon: Home, active: false },
    { label: 'Biblia', icon: BookOpen, active: true },
    { label: 'Estudos', icon: Library, active: false },
    { label: 'Planos de Leitura', icon: CalendarDays, active: false },
    { label: 'Favoritos', icon: Star, active: false },
    { label: 'Anotacoes', icon: PenLine, active: false },
    { label: 'Historico', icon: Clock3, active: false },
    { label: 'Configuracoes', icon: Settings, active: false },
];

type DashboardSidebarProps = {
    stats: DashboardStats;
};

export function DashboardSidebar({ stats }: DashboardSidebarProps) {
    return (
        <aside className="bible-sidebar">
            <AppLogo />

            <nav className="bible-nav" aria-label="Principal">
                {navigationItems.map((item) => (
                    <SidebarNavItem key={item.label} item={item} />
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

function SidebarNavItem({ item }: { item: NavigationItem }) {
    const Icon = item.icon;

    return (
        <button type="button" className={item.active ? 'active' : ''}>
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
        </button>
    );
}
