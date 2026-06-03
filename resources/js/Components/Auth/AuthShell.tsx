import type { ReactNode } from 'react';

import { AppLogo } from '../Dashboard/Sidebar';

type AuthShellProps = {
    title: string;
    subtitle: string;
    children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
    return (
        <main className="auth-shell">
            <section className="auth-intro">
                <AppLogo />
                <div>
                    <p className="auth-verse">
                        "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho."
                    </p>
                    <span>Salmos 119:105</span>
                </div>
            </section>

            <section className="auth-panel">
                <div className="auth-panel-inner">
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                    {children}
                </div>
            </section>
        </main>
    );
}

type AuthFieldProps = {
    label: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    autoComplete?: string;
};

export function AuthField({ label, type, value, onChange, error, autoComplete }: AuthFieldProps) {
    return (
        <label className="auth-field">
            <span>{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                autoComplete={autoComplete}
                required
            />
            {error && <small>{error}</small>}
        </label>
    );
}
