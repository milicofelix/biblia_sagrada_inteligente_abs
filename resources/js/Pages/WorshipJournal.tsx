import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BookOpen, CalendarDays, Check, Church, Loader2, Save, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { DashboardSidebar } from '../Components/Dashboard/Sidebar';
import type { AuthUser, DashboardSettings, DashboardStats } from '../types/dashboard';

type WorshipPassageVerse = {
    reference: string;
    text: string;
    translation?: string | null;
};

type WorshipJournalEntry = {
    id: number;
    worshipDate: string;
    formattedDate?: string | null;
    passageReference: string;
    title?: string | null;
    churchName?: string | null;
    preacherName?: string | null;
    personalNotes?: string | null;
    passage?: WorshipPassageVerse[];
    aiStudy?: string | null;
    status: string;
    progressPercent?: number;
    progressStep?: string | null;
    progressMessage?: string | null;
    error?: string | null;
};

type WorshipJournalProps = {
    stats: DashboardStats;
    settings?: DashboardSettings;
    entries: WorshipJournalEntry[];
};

type SharedProps = {
    auth?: { user?: AuthUser };
    flash?: { status?: string | null };
};

const processingStatuses = ['queued', 'running'];

export default function WorshipJournal({ stats, settings = {}, entries }: WorshipJournalProps) {
    const shared = usePage<SharedProps>().props;
    const [journalEntries, setJournalEntries] = useState(entries);
    const form = useForm({
        worship_date: new Date().toISOString().slice(0, 10),
        passage_reference: '',
        title: '',
        church_name: '',
        preacher_name: '',
        personal_notes: '',
    });

    useEffect(() => {
        setJournalEntries(entries);
    }, [entries]);

    const activeProcessingEntry = useMemo(
        () => journalEntries.find((entry) => processingStatuses.includes(entry.status)) ?? null,
        [journalEntries],
    );

    useEffect(() => {
        const pending = journalEntries.filter((entry) => processingStatuses.includes(entry.status));

        if (pending.length === 0) {
            return;
        }

        const timer = window.setTimeout(async () => {
            const updates = await Promise.all(
                pending.map(async (entry) => {
                    const response = await fetch(`/diario-cultos/${entry.id}`, {
                        headers: { Accept: 'application/json' },
                    });

                    if (!response.ok) {
                        return entry;
                    }

                    const data = await response.json();

                    return data.entry ?? entry;
                }),
            );

            setJournalEntries((current) => current.map((entry) => updates.find((update) => update.id === entry.id) ?? entry));
        }, 1600);

        return () => window.clearTimeout(timer);
    }, [journalEntries]);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/diario-cultos', {
            preserveScroll: true,
            onSuccess: () => form.reset('passage_reference', 'title', 'church_name', 'preacher_name', 'personal_notes'),
        });
    }

    function navigate(label: string) {
        if (activeProcessingEntry) {
            return;
        }

        if (label === 'Diario de Cultos') {
            return;
        }

        if (label === 'Configuracoes') {
            router.get('/configuracoes');

            return;
        }

        router.get('/');
    }

    return (
        <>
            <Head title="Diario de Cultos" />
            <main className={`settings-shell worship-shell ${settings.theme === 'night' ? 'theme-night' : ''}`}>
                {activeProcessingEntry && <WorshipProcessingOverlay entry={activeProcessingEntry} />}

                <DashboardSidebar stats={stats} activeLabel="Diario de Cultos" onNavigate={navigate} />

                <section className="settings-main">
                    <header className="settings-header">
                        <div>
                            <span>Caminhada nos cultos</span>
                            <h1>Diario de Cultos</h1>
                            <p>{shared.auth?.user?.name ?? 'Leitor'}, registre a passagem pregada e preserve o estudo gerado pela IA.</p>
                        </div>
                        <button type="button" className="settings-back" disabled={Boolean(activeProcessingEntry)} onClick={() => router.get('/')}>
                            <BookOpen className="h-4 w-4" />
                            Voltar para a Biblia
                        </button>
                    </header>

                    <form onSubmit={submit} className="worship-form" aria-busy={form.processing || Boolean(activeProcessingEntry)}>
                        <div className="worship-form-grid">
                            <label className="settings-field">
                                <span>Data do culto</span>
                                <input
                                    type="date"
                                    value={form.data.worship_date}
                                    onChange={(event) => form.setData('worship_date', event.target.value)}
                                    disabled={form.processing || Boolean(activeProcessingEntry)}
                                />
                                {form.errors.worship_date && <small>{form.errors.worship_date}</small>}
                            </label>

                            <label className="settings-field">
                                <span>Passagem principal</span>
                                <input
                                    value={form.data.passage_reference}
                                    onChange={(event) => form.setData('passage_reference', event.target.value)}
                                    placeholder="Salmos 44,26"
                                    disabled={form.processing || Boolean(activeProcessingEntry)}
                                />
                                {form.errors.passage_reference && <small>{form.errors.passage_reference}</small>}
                            </label>

                            <label className="settings-field">
                                <span>Tema da mensagem</span>
                                <input
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value)}
                                    placeholder="Socorro e restauracao"
                                    disabled={form.processing || Boolean(activeProcessingEntry)}
                                />
                                {form.errors.title && <small>{form.errors.title}</small>}
                            </label>

                            <label className="settings-field">
                                <span>Igreja/local</span>
                                <input
                                    value={form.data.church_name}
                                    onChange={(event) => form.setData('church_name', event.target.value)}
                                    placeholder="Nome da igreja"
                                    disabled={form.processing || Boolean(activeProcessingEntry)}
                                />
                                {form.errors.church_name && <small>{form.errors.church_name}</small>}
                            </label>

                            <label className="settings-field">
                                <span>Pregador</span>
                                <input
                                    value={form.data.preacher_name}
                                    onChange={(event) => form.setData('preacher_name', event.target.value)}
                                    placeholder="Nome do pregador"
                                    disabled={form.processing || Boolean(activeProcessingEntry)}
                                />
                                {form.errors.preacher_name && <small>{form.errors.preacher_name}</small>}
                            </label>
                        </div>

                        <label className="settings-field">
                            <span>Anotacoes pessoais</span>
                            <textarea
                                value={form.data.personal_notes}
                                onChange={(event) => form.setData('personal_notes', event.target.value)}
                                rows={5}
                                placeholder="Frases, pontos principais, aplicacoes citadas no culto..."
                                disabled={form.processing || Boolean(activeProcessingEntry)}
                            />
                            {form.errors.personal_notes && <small>{form.errors.personal_notes}</small>}
                        </label>

                        <footer className="settings-footer">
                            {shared.flash?.status === 'worship-journal-created' && (
                                <p>
                                    <Check className="h-4 w-4" />
                                    Culto registrado. O agente esta preparando o estudo.
                                </p>
                            )}
                            <button type="submit" disabled={form.processing || Boolean(activeProcessingEntry)}>
                                <Save className="h-4 w-4" />
                                {form.processing ? 'Salvando...' : activeProcessingEntry ? 'Processando estudo...' : 'Registrar culto'}
                            </button>
                        </footer>
                    </form>

                    <section className="worship-list">
                        {journalEntries.length > 0 ? (
                            journalEntries.map((entry) => <WorshipEntryCard key={entry.id} entry={entry} />)
                        ) : (
                            <div className="worship-empty">
                                <Church className="h-8 w-8" />
                                <h2>Nenhum culto registrado ainda</h2>
                                <p>Comece registrando a data e a passagem principal da mensagem.</p>
                            </div>
                        )}
                    </section>
                </section>
            </main>
        </>
    );
}

function WorshipProcessingOverlay({ entry }: { entry: WorshipJournalEntry }) {
    const percent = Math.max(0, Math.min(100, entry.progressPercent ?? (entry.status === 'running' ? 45 : 10)));
    const message = entry.progressMessage ?? 'Aguardando o backend atualizar o andamento do estudo.';
    const step = entry.progressStep ?? (entry.status === 'queued' ? 'na-fila' : 'processando');

    return (
        <div className="worship-processing-overlay" role="status" aria-live="polite">
            <div className="worship-processing-card">
                <div className="worship-processing-icon">
                    <Sparkles className="h-6 w-6" />
                </div>

                <span>Diario de Cultos</span>
                <h2>Gerando estudo com IA</h2>
                <p>{message}</p>

                <div className="worship-processing-meta">
                    <strong>{percent}%</strong>
                    <small>{step.replaceAll('-', ' ')}</small>
                </div>

                <div className="worship-progress-track" aria-label={`Progresso ${percent}%`}>
                    <div className="worship-progress-bar" style={{ width: `${percent}%` }} />
                </div>

                <ul>
                    {progressSteps(percent).map((item) => (
                        <li key={item.label} className={item.done ? 'done' : item.active ? 'active' : ''}>
                            {item.done ? <ShieldCheck className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />}
                            {item.label}
                        </li>
                    ))}
                </ul>

                <small>Nao feche nem navegue nesta tela ate o estudo ser concluido.</small>
            </div>
        </div>
    );
}

function progressSteps(percent: number) {
    return [
        { label: 'Registro salvo', threshold: 8 },
        { label: 'Passagem localizada', threshold: 30 },
        { label: 'Contexto organizado', threshold: 50 },
        { label: 'Agente IA consultado', threshold: 72 },
        { label: 'Estudo salvo no diario', threshold: 100 },
    ].map((item, index, all) => ({
        label: item.label,
        done: percent >= item.threshold,
        active: percent < item.threshold && (index === 0 || percent >= all[index - 1].threshold),
    }));
}

function WorshipEntryCard({ entry }: { entry: WorshipJournalEntry }) {
    return (
        <article className="worship-entry-card">
            <header>
                <div>
                    <span>
                        <CalendarDays className="h-4 w-4" />
                        {entry.formattedDate ?? entry.worshipDate}
                    </span>
                    <h2>{entry.title || entry.passageReference}</h2>
                    <p>{entry.passageReference}</p>
                </div>
                <StatusBadge status={entry.status} />
            </header>

            <div className="worship-entry-meta">
                {entry.churchName && <span><Church className="h-4 w-4" /> {entry.churchName}</span>}
                {entry.preacherName && <span><UserRound className="h-4 w-4" /> {entry.preacherName}</span>}
            </div>

            {entry.personalNotes && (
                <blockquote>{entry.personalNotes}</blockquote>
            )}

            {entry.passage && entry.passage.length > 0 && (
                <div className="worship-passage">
                    {entry.passage.slice(0, 4).map((verse) => (
                        <p key={verse.reference}>
                            <strong>{verse.reference}</strong>
                            {verse.translation ? ` (${verse.translation})` : ''}: {verse.text}
                        </p>
                    ))}
                </div>
            )}

            {entry.aiStudy ? (
                <div className="worship-study">
                    {entry.aiStudy.split(/\n{2,}/).map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </div>
            ) : entry.error ? (
                <p className="worship-error">{entry.error}</p>
            ) : (
                <div className="worship-loading">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {entry.progressMessage ?? 'O agente esta interpretando esta mensagem.'}
                </div>
            )}
        </article>
    );
}

function StatusBadge({ status }: { status: string }) {
    const label = {
        queued: 'Na fila',
        running: 'Em estudo',
        completed: 'Concluido',
        failed: 'Falhou',
    }[status] ?? status;

    return <span className={`worship-status ${status}`}>{label}</span>;
}
