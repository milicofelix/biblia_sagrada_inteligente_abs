import type { FormEvent } from 'react';

import { router } from '@inertiajs/react';
import { Bell, LogOut, Moon, Search, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { AuthUser } from '../../types/dashboard';

type TopBarProps = {
    reference: string;
    user?: AuthUser;
    onReferenceChange: (reference: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onReadingMode?: () => void;
};

export function TopBar({ reference, user, onReferenceChange, onSubmit, onReadingMode }: TopBarProps) {
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
                <TopIconButton label="Modo leitura" icon={Moon} onClick={onReadingMode} />
                <TopIconButton label="Notificacoes" icon={Bell} disabled />
                <div className="profile-chip">
                    <div className="profile-avatar">
                        <UserRound className="h-4 w-4" />
                    </div>
                    <div>
                        <strong>{user?.name ?? 'Leitor'}</strong>
                        <span>{user?.email ?? 'Conta pessoal'}</span>
                    </div>
                </div>
                <TopIconButton label="Sair" icon={LogOut} onClick={() => router.post('/logout')} />
            </div>
        </header>
    );
}

function TopIconButton({ label, icon: Icon, onClick, disabled = false }: { label: string; icon: LucideIcon; onClick?: () => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            className="top-icon-button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            title={disabled ? 'Em breve' : undefined}
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}
