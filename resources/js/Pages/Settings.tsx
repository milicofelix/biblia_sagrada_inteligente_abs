import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Bell, BookOpen, Check, Moon, Save, Sun } from 'lucide-react';
import type { FormEvent } from 'react';

import { DashboardSidebar } from '../Components/Dashboard/Sidebar';
import type { AuthUser, DashboardStats } from '../types/dashboard';

type TranslationOption = {
    id: number;
    name: string;
    abbreviation: string;
};

type SettingsData = {
    translationId: number | null;
    initialReference: string;
    theme: 'light' | 'night';
    notificationsEnabled: boolean;
};

type SettingsProps = {
    stats: DashboardStats;
    settings: SettingsData;
    translations: TranslationOption[];
};

type SharedProps = {
    auth?: { user?: AuthUser };
    flash?: { status?: string | null };
};

export default function Settings({ stats, settings, translations }: SettingsProps) {
    const shared = usePage<SharedProps>().props;
    const form = useForm({
        translation_id: settings.translationId,
        initial_reference: settings.initialReference,
        theme: settings.theme,
        notifications_enabled: settings.notificationsEnabled,
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.patch('/configuracoes', { preserveScroll: true });
    }

    function navigate(label: string) {
        if (label === 'Configuracoes') {
            return;
        }

        if (label === 'Diario de Cultos') {
            router.get('/diario-cultos');

            return;
        }

        router.get('/');
    }

    return (
        <>
            <Head title="Configuracoes" />
            <main className={`settings-shell ${form.data.theme === 'night' ? 'theme-night' : ''}`}>
                <DashboardSidebar stats={stats} activeLabel="Configuracoes" onNavigate={navigate} />

                <section className="settings-main">
                    <header className="settings-header">
                        <div>
                            <span>Conta pessoal</span>
                            <h1>Configuracoes</h1>
                            <p>{shared.auth?.user?.name ?? 'Leitor'}, personalize sua experiencia de leitura e estudo.</p>
                        </div>
                        <button type="button" className="settings-back" onClick={() => router.get('/')}>
                            <BookOpen className="h-4 w-4" />
                            Voltar para a Biblia
                        </button>
                    </header>

                    <form onSubmit={submit} className="settings-form">
                        <section className="settings-section">
                            <div className="settings-section-heading">
                                <BookOpen className="h-5 w-5" />
                                <div>
                                    <h2>Leitura</h2>
                                    <p>Preferencias usadas ao abrir e pesquisar as Escrituras.</p>
                                </div>
                            </div>

                            <div className="settings-controls">
                                <label className="settings-field">
                                    <span>Traducao padrao</span>
                                    <select
                                        value={form.data.translation_id ?? ''}
                                        onChange={(event) => form.setData('translation_id', event.target.value ? Number(event.target.value) : null)}
                                    >
                                        <option value="">Traducao disponivel automaticamente</option>
                                        {translations.map((translation) => (
                                            <option key={translation.id} value={translation.id}>
                                                {translation.name} ({translation.abbreviation})
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.translation_id && <small>{form.errors.translation_id}</small>}
                                </label>

                                <label className="settings-field">
                                    <span>Passagem inicial</span>
                                    <input
                                        value={form.data.initial_reference}
                                        onChange={(event) => form.setData('initial_reference', event.target.value)}
                                        placeholder="Joao 3:16"
                                    />
                                    {form.errors.initial_reference && <small>{form.errors.initial_reference}</small>}
                                </label>
                            </div>
                        </section>

                        <section className="settings-section">
                            <div className="settings-section-heading">
                                <Sun className="h-5 w-5" />
                                <div>
                                    <h2>Aparencia</h2>
                                    <p>Escolha o ambiente visual mais confortavel para leitura.</p>
                                </div>
                            </div>

                            <div className="settings-field">
                                <span>Tema</span>
                                <div className="theme-segmented" role="group" aria-label="Tema">
                                    <button
                                        type="button"
                                        className={form.data.theme === 'light' ? 'selected' : ''}
                                        onClick={() => form.setData('theme', 'light')}
                                    >
                                        <Sun className="h-4 w-4" />
                                        Claro
                                    </button>
                                    <button
                                        type="button"
                                        className={form.data.theme === 'night' ? 'selected' : ''}
                                        onClick={() => form.setData('theme', 'night')}
                                    >
                                        <Moon className="h-4 w-4" />
                                        Noturno
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="settings-section">
                            <div className="settings-section-heading">
                                <Bell className="h-5 w-5" />
                                <div>
                                    <h2>Lembretes</h2>
                                    <p>Controle o recebimento de lembretes de leitura quando estiverem disponiveis.</p>
                                </div>
                            </div>

                            <label className="settings-toggle">
                                <div>
                                    <strong>Lembretes de leitura</strong>
                                    <span>Permitir notificacoes sobre planos e estudos.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={form.data.notifications_enabled}
                                    onChange={(event) => form.setData('notifications_enabled', event.target.checked)}
                                />
                            </label>
                        </section>

                        <footer className="settings-footer">
                            {shared.flash?.status === 'settings-updated' && (
                                <p>
                                    <Check className="h-4 w-4" />
                                    Configuracoes salvas.
                                </p>
                            )}
                            <button type="submit" disabled={form.processing}>
                                <Save className="h-4 w-4" />
                                {form.processing ? 'Salvando...' : 'Salvar configuracoes'}
                            </button>
                        </footer>
                    </form>
                </section>
            </main>
        </>
    );
}
