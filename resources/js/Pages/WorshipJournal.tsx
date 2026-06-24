import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BookOpen, CalendarDays, Check, Church, Loader2, Save, Sparkles, UserRound } from 'lucide-react';
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

type WorshipPreloadState = {
    isOpen: boolean;
    percent: number;
    message: string;
    detail: string;
};

const WORSHIP_PRELOAD_STEPS = [
    { until: 18, message: 'Salvando o culto', detail: 'Registrando data, passagem, tema e suas anotacoes pessoais.' },
    { until: 35, message: 'Preparando a passagem', detail: 'Normalizando a referencia e buscando o texto biblico relacionado.' },
    { until: 55, message: 'Acionando o agente IA', detail: 'Enviando o culto para a fila de estudo biblico pastoral.' },
    { until: 75, message: 'Gerando resumo inteligente', detail: 'O agente esta organizando resumo, contexto, aplicacoes e pontos para revisao.' },
    { until: 92, message: 'Atualizando o diario', detail: 'Aguardando o retorno do estudo para exibir o card sem precisar atualizar a pagina.' },
    { until: 100, message: 'Estudo pronto', detail: 'Resumo recebido e Diario de Cultos atualizado.' },
];

export default function WorshipJournal({ stats, settings = {}, entries }: WorshipJournalProps) {
    const shared = usePage<SharedProps>().props;
    const [journalEntries, setJournalEntries] = useState(entries);
    const [trackedEntryId, setTrackedEntryId] = useState<number | null>(null);
    const [preload, setPreload] = useState<WorshipPreloadState>({
        isOpen: false,
        percent: 0,
        message: 'Preparando registro',
        detail: 'Aguarde enquanto organizamos o Diario de Cultos.',
    });
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

        if (preload.isOpen && entries.length > 0) {
            const newestEntry = entries[0];
            setTrackedEntryId(newestEntry.id);
            setPreloadProgress(62, 'Culto registrado', 'O card foi criado. Agora estamos acompanhando a geracao do estudo.');
        }
    }, [entries]);

    const trackedEntry = useMemo(
        () => journalEntries.find((entry) => entry.id === trackedEntryId) ?? null,
        [journalEntries, trackedEntryId],
    );

    useEffect(() => {
        if (!preload.isOpen || !trackedEntry) {
            return;
        }

        if (trackedEntry.status === 'completed' && trackedEntry.aiStudy) {
            setPreloadProgress(100, 'Estudo pronto', 'Resumo recebido e Diario de Cultos atualizado.');
            const closeTimer = window.setTimeout(() => {
                setPreload((current) => ({ ...current, isOpen: false }));
                setTrackedEntryId(null);
            }, 900);

            return () => window.clearTimeout(closeTimer);
        }

        if (trackedEntry.status === 'failed') {
            setPreloadProgress(100, 'Nao foi possivel concluir', trackedEntry.error ?? 'O agente retornou uma falha. Revise o card do culto.');
            const closeTimer = window.setTimeout(() => {
                setPreload((current) => ({ ...current, isOpen: false }));
                setTrackedEntryId(null);
            }, 1600);

            return () => window.clearTimeout(closeTimer);
        }

        if (trackedEntry.status === 'running') {
            setPreloadProgress(82, 'Gerando resumo inteligente', 'O agente esta montando resumo, contexto, aplicacoes e pontos de revisao.');
        }

        if (trackedEntry.status === 'queued') {
            setPreloadProgress(70, 'Aguardando agente IA', 'O culto entrou na fila. Estamos verificando automaticamente o resultado.');
        }
    }, [preload.isOpen, trackedEntry]);

    useEffect(() => {
        if (!preload.isOpen || preload.percent >= 94) {
            return;
        }

        const timer = window.setInterval(() => {
            setPreload((current) => {
                if (!current.isOpen || current.percent >= 94) {
                    return current;
                }

                const nextPercent = Math.min(current.percent + 3, 94);
                const nextStep = WORSHIP_PRELOAD_STEPS.find((step) => nextPercent <= step.until) ?? WORSHIP_PRELOAD_STEPS[WORSHIP_PRELOAD_STEPS.length - 1];

                return {
                    ...current,
                    percent: nextPercent,
                    message: nextStep.message,
                    detail: nextStep.detail,
                };
            });
        }, 700);

        return () => window.clearInterval(timer);
    }, [preload.isOpen, preload.percent]);

    useEffect(() => {
        const pending = journalEntries.filter((entry) => ['queued', 'running'].includes(entry.status));

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
        }, 2500);

        return () => window.clearTimeout(timer);
    }, [journalEntries]);

    function setPreloadProgress(percent: number, message: string, detail: string) {
        setPreload((current) => {
            if (percent < current.percent) {
                return current;
            }

            return {
                ...current,
                isOpen: true,
                percent,
                message,
                detail,
            };
        });
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setTrackedEntryId(null);
        setPreload({
            isOpen: true,
            percent: 8,
            message: 'Salvando o culto',
            detail: 'Registrando data, passagem, tema e suas anotacoes pessoais.',
        });

        form.post('/diario-cultos', {
            preserveScroll: true,
            preserveState: false,
            onStart: () => setPreloadProgress(18, 'Salvando o culto', 'Enviando o formulario para o Diario de Cultos.'),
            onSuccess: () => {
                setPreloadProgress(58, 'Culto registrado', 'O agente IA foi acionado. Vamos acompanhar a geracao automaticamente.');
                form.reset('passage_reference', 'title', 'church_name', 'preacher_name', 'personal_notes');
            },
            onError: () => {
                setPreload({
                    isOpen: true,
                    percent: 100,
                    message: 'Revise o formulario',
                    detail: 'Algum campo precisa de ajuste antes de registrar o culto.',
                });
                window.setTimeout(() => setPreload((current) => ({ ...current, isOpen: false })), 1400);
            },
            onFinish: () => setPreloadProgress(50, 'Processando retorno', 'Atualizando o Diario de Cultos sem exigir refresh manual.'),
        });
    }

    function navigate(label: string) {
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
                <DashboardSidebar stats={stats} activeLabel="Diario de Cultos" onNavigate={navigate} />

                <section className="settings-main">
                    <header className="settings-header">
                        <div>
                            <span>Caminhada nos cultos</span>
                            <h1>Diario de Cultos</h1>
                            <p>{shared.auth?.user?.name ?? 'Leitor'}, registre a passagem pregada e preserve o estudo gerado pela IA.</p>
                        </div>
                        <button type="button" className="settings-back" onClick={() => router.get('/')} disabled={preload.isOpen || form.processing}>
                            <BookOpen className="h-4 w-4" />
                            Voltar para a Biblia
                        </button>
                    </header>

                    <form onSubmit={submit} className="worship-form" aria-busy={preload.isOpen || form.processing}>
                        <div className="worship-form-grid">
                            <label className="settings-field">
                                <span>Data do culto</span>
                                <input
                                    type="date"
                                    value={form.data.worship_date}
                                    onChange={(event) => form.setData('worship_date', event.target.value)}
                                />
                                {form.errors.worship_date && <small>{form.errors.worship_date}</small>}
                            </label>

                            <label className="settings-field">
                                <span>Passagem principal</span>
                                <input
                                    value={form.data.passage_reference}
                                    onChange={(event) => form.setData('passage_reference', event.target.value)}
                                    placeholder="Salmos 44,26"
                                />
                                {form.errors.passage_reference && <small>{form.errors.passage_reference}</small>}
                            </label>

                            <label className="settings-field">
                                <span>Tema da mensagem</span>
                                <input
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value)}
                                    placeholder="Socorro e restauracao"
                                />
                                {form.errors.title && <small>{form.errors.title}</small>}
                            </label>

                            <label className="settings-field">
                                <span>Igreja/local</span>
                                <input
                                    value={form.data.church_name}
                                    onChange={(event) => form.setData('church_name', event.target.value)}
                                    placeholder="Nome da igreja"
                                />
                                {form.errors.church_name && <small>{form.errors.church_name}</small>}
                            </label>

                            <label className="settings-field">
                                <span>Pregador</span>
                                <input
                                    value={form.data.preacher_name}
                                    onChange={(event) => form.setData('preacher_name', event.target.value)}
                                    placeholder="Nome do pregador"
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
                            <button type="submit" disabled={preload.isOpen || form.processing}>
                                <Save className="h-4 w-4" />
                                {form.processing ? 'Salvando...' : 'Registrar culto'}
                            </button>
                        </footer>
                    </form>

                    {preload.isOpen && <WorshipRegisterPreload progress={preload} />}

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

function WorshipRegisterPreload({ progress }: { progress: WorshipPreloadState }) {
    const safePercent = Math.min(Math.max(progress.percent, 0), 100);

    return (
        <div className="worship-preload-overlay" role="status" aria-live="polite" aria-label="Registro de culto em andamento">
            <section className="worship-preload-card">
                <div className="worship-preload-icon">
                    {safePercent >= 100 ? <Check className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                </div>
                <div className="worship-preload-copy">
                    <span>Registro em andamento</span>
                    <h2>{progress.message}</h2>
                    <p>{progress.detail}</p>
                </div>
                <div className="worship-preload-percent">{safePercent}%</div>
                <div className="worship-preload-bar" aria-hidden="true">
                    <span style={{ width: `${safePercent}%` }} />
                </div>
                <ol className="worship-preload-steps">
                    {WORSHIP_PRELOAD_STEPS.slice(0, 5).map((step) => (
                        <li key={step.message} className={safePercent >= step.until - 10 ? 'active' : ''}>
                            {step.message}
                        </li>
                    ))}
                </ol>
            </section>
        </div>
    );
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
                    O agente esta interpretando esta mensagem.
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
