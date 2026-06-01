import type { FormEvent } from 'react';

import { Bell, ChevronDown, Moon, Search, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type TopBarProps = {
    reference: string;
    onReferenceChange: (reference: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function TopBar({ reference, onReferenceChange, onSubmit }: TopBarProps) {
    return (
        <header className="bible-topbar">
            <form onSubmit={onSubmit} className="top-search">
                <Search className="h-4 w-4" />
                <input
                    value={reference}
                    onChange={(event) => onReferenceChange(event.target.value)}
                    placeholder="Buscar por palavra-chave, versiculo ou tema..."
                />
                <kbd>Ctrl K</kbd>
                <button type="submit">Buscar</button>
            </form>

            <div className="top-actions">
                <TopIconButton label="Modo leitura" icon={Moon} />
                <TopIconButton label="Notificacoes" icon={Bell} />
                <div className="profile-chip">
                    <div className="profile-avatar">
                        <UserRound className="h-4 w-4" />
                    </div>
                    <div>
                        <strong>Adriano</strong>
                        <span>Plano Premium</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                </div>
            </div>
        </header>
    );
}

function TopIconButton({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
    return (
        <button type="button" className="top-icon-button" aria-label={label}>
            <Icon className="h-4 w-4" />
        </button>
    );
}
