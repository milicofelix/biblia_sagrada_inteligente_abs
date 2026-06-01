import { Head, router } from '@inertiajs/react';
import {
    BookOpen,
    Brain,
    CalendarDays,
    Check,
    Copy,
    GitBranch,
    Library,
    ListChecks,
    MessageSquareText,
    NotebookPen,
    Pause,
    Headphones,
    Play,
    Send,
    Share2,
    Sparkles,
    Square,
    Star,
    Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { FavoritesCard, HistoryCard, NotesCard, ReadingPlanCard } from '../Components/Dashboard/LibraryCards';
import { ChronologyContext } from '../Components/Dashboard/ChronologyContext';
import { DashboardSidebar } from '../Components/Dashboard/Sidebar';
import { StudyTools } from '../Components/Dashboard/StudyTools';
import { TopBar } from '../Components/Dashboard/TopBar';
import { VerseResult } from '../Components/Dashboard/VerseResult';
import type { DashboardProps, ReadingPlan } from '../types/dashboard';
import { formatDate } from '../utils/date';

const agents = [
    {
        name: 'Teologo',
        icon: Library,
        description: 'Contexto historico, autoria, destinatarios e leitura textual.',
        status: 'Preparado',
    },
    {
        name: 'Conexoes Biblicas',
        icon: GitBranch,
        description: 'Liga passagens entre Lei, Profetas, Evangelhos e Epistolas.',
        status: 'Preparado',
    },
    {
        name: 'Aplicacao Pratica',
        icon: ListChecks,
        description: 'Transforma o texto em vida pessoal, familia, trabalho e estudos.',
        status: 'Preparado',
    },
    {
        name: 'Cronologia',
        icon: CalendarDays,
        description: 'Posiciona eventos na narrativa biblica de forma progressiva.',
        status: 'Preparado',
    },
    {
        name: 'Estudos',
        icon: NotebookPen,
        description: 'Gera resumos, flashcards, quiz e planos curtos de leitura.',
        status: 'Preparado',
    },
];

const tabs = [
    { name: 'IA Explica', icon: Brain, agent: 'theologian' },
    { name: 'Contexto', icon: BookOpen, agent: 'theologian' },
    { name: 'Referencias', icon: GitBranch, agent: 'biblical_connections' },
    { name: 'Aplicacao', icon: ListChecks, agent: 'practical_application' },
    { name: 'Cronologia', icon: CalendarDays, agent: 'chronology' },
    { name: 'Estudos', icon: NotebookPen, agent: 'study' },
];

export default function Dashboard({
    initialReference = 'Joao 3:16',
    search = { term: '', results: [] },
    stats = {},
    recentAnswers = [],
    recentNotes = [],
    recentFavorites = [],
    activeReadingPlan = null,
}: DashboardProps) {
    const [reference, setReference] = useState(initialReference);
    const [activeTab, setActiveTab] = useState(tabs[0].name);
    const [statsState, setStatsState] = useState(stats);
    const [aiQuestion, setAiQuestion] = useState('Estou desanimado, existe algo na Biblia sobre perseveranca?');
    const [aiAnswer, setAiAnswer] = useState(null);
    const [answerHistory, setAnswerHistory] = useState(recentAnswers);
    const [noteHistory, setNoteHistory] = useState(recentNotes);
    const [favoriteHistory, setFavoriteHistory] = useState(recentFavorites);
    const [readingPlan, setReadingPlan] = useState<ReadingPlan | null>(activeReadingPlan);
    const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);
    const [favoriteOverrides, setFavoriteOverrides] = useState<Record<number, boolean>>({});
    const [activeNav, setActiveNav] = useState('Biblia');
    const [copyStatus, setCopyStatus] = useState('');
    const [aiError, setAiError] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('Preparando o estudo');
    const activeSection = aiAnswer?.sections?.find((section) => section.agent === tabs.find((tab) => tab.name === activeTab)?.agent);
    const devotionalAudioItems = useMemo(() => buildDevotionalAudioItems({
        reference,
        searchResults: search.results ?? [],
        answer: aiAnswer,
    }), [reference, search.results, aiAnswer]);
    const podcastEpisode = useMemo(() => buildPodcastEpisode({
        reference,
        items: devotionalAudioItems,
        answer: aiAnswer,
    }), [reference, devotionalAudioItems, aiAnswer]);

    useEffect(() => {
        setSelectedVerseId(null);
        setCopyStatus('');
    }, [search.term]);

    function submit(event) {
        event.preventDefault();

        router.get('/buscar', { q: reference }, {
            preserveScroll: true,
        });
    }

    async function askAgents(event) {
        event.preventDefault();

        const question = aiQuestion.trim();

        if (!question) {
            setAiError('Digite uma pergunta para consultar os agentes.');
            return;
        }

        setAiLoading(true);
        setLoadingStep('Enfileirando os agentes');
        setAiError('');
        setAiAnswer(null);

        const response = await fetch('/ai/responder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ question }),
        });

        const data = await response.json().catch(() => ({}));

        setAiLoading(false);

        if (!response.ok) {
            setAiError(data.message ?? 'Nao foi possivel consultar os agentes agora.');
            setAiLoading(false);
            return;
        }

        setAiAnswer(data.answer);
        setAnswerHistory((current) => [
            data.answer,
            ...current.filter((answer) => answer.id !== data.answer.id),
        ].slice(0, 6));
        setActiveTab(tabs[0].name);

        if (['queued', 'running'].includes(data.answer.status)) {
            pollAnswer(data.answer.id);
            return;
        }

        setAiLoading(false);
    }

    async function saveStudyNote(verseId, body) {
        const response = await fetch(`/versiculos/${verseId}/notas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ body }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message ?? 'Nao foi possivel salvar a nota.');
        }

        setStatsState((current) => ({
            ...current,
            notes: data.stats?.notes ?? current.notes,
        }));
        setNoteHistory((current) => [
            data.note,
            ...current.filter((note) => note.id !== data.note.id),
        ].slice(0, 6));

        return data.note;
    }

    async function toggleFavorite(verseId: number): Promise<boolean> {
        const response = await fetch(`/versiculos/${verseId}/favorito`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message ?? 'Nao foi possivel atualizar o favorito.');
        }

        setStatsState((current) => ({
            ...current,
            favorites: data.stats?.favorites ?? current.favorites,
        }));

        if (data.favorited && data.favorite) {
            setFavoriteOverrides((current) => ({
                ...current,
                [verseId]: true,
            }));
            setFavoriteHistory((current) => [
                data.favorite,
                ...current.filter((favorite) => favorite.verseId !== data.favorite.verseId),
            ].slice(0, 6));
        } else {
            setFavoriteOverrides((current) => ({
                ...current,
                [verseId]: false,
            }));
            setFavoriteHistory((current) => current.filter((favorite) => favorite.verseId !== verseId));
        }

        return Boolean(data.favorited);
    }

    async function completeReadingDay(dayId: number): Promise<ReadingPlan> {
        const response = await fetch(`/planos-leitura/dias/${dayId}/concluir`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message ?? 'Nao foi possivel concluir a leitura.');
        }

        setReadingPlan(data.plan);

        if (data.plan?.currentDay?.reference) {
            setReference(data.plan.currentDay.reference);
        }

        return data.plan;
    }

    function openNote(note) {
        if (note.reference) {
            openReference(note.reference);
        }
    }

    function openReference(nextReference: string) {
        setReference(nextReference);

        window.location.assign(`/buscar?q=${encodeURIComponent(nextReference)}`);
    }

    function scrollToPanel(panelId: string) {
        window.setTimeout(() => {
            document.getElementById(panelId)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 0);
    }

    function handleSidebarNavigate(label: string) {
        setActiveNav(label);

        const actions: Record<string, () => void> = {
            Inicio: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
            Biblia: () => scrollToPanel('bible-reader'),
            Estudos: () => {
                setActiveTab('Estudos');
                scrollToPanel('ai-study-card');
            },
            'Planos de Leitura': () => scrollToPanel('reading-plan-card'),
            Favoritos: () => scrollToPanel('favorites-card'),
            Anotacoes: () => scrollToPanel('notes-card'),
            Historico: () => scrollToPanel('history-card'),
        };

        actions[label]?.();
    }

    function selectAdjacentVerse(direction: -1 | 1) {
        if (! search.results?.length) {
            return;
        }

        const nextVerse = search.results[currentVerseIndex + direction];

        if (nextVerse) {
            setSelectedVerseId(nextVerse.id);
            setReference(nextVerse.reference);
            setCopyStatus('');
            scrollToPanel('bible-reader');
        }
    }

    async function copyPrimaryVerse() {
        if (! primaryVerse) {
            return;
        }

        const text = `${primaryVerse.reference}\n${primaryVerse.text}`;

        try {
            await navigator.clipboard.writeText(text);
            setCopyStatus('Copiado');
        } catch (error) {
            setCopyStatus('Nao foi possivel copiar');
        }
    }

    async function togglePrimaryFavorite() {
        if (! primaryVerse) {
            return;
        }

        await toggleFavorite(primaryVerse.id);
    }

    function openAnswer(answer) {
        if (aiLoading) {
            return;
        }

        setAiAnswer(answer);
        setAiQuestion(answer.question ?? aiQuestion);
        setAiError('');
        setActiveTab(tabs[0].name);
    }

    function pollAnswer(answerId, attempt = 0) {
        window.setTimeout(async () => {
            setLoadingStep(attempt % 2 === 0 ? 'Lendo contexto e conexoes' : 'Organizando a resposta dos agentes');

            const response = await fetch(`/ai/respostas/${answerId}`, {
                headers: { Accept: 'application/json' },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.answer) {
                setAiError('Nao foi possivel acompanhar este estudo agora. Recarregue a pagina em alguns instantes.');
                setAiLoading(false);
                return;
            }

            setAiAnswer(data.answer);
            setAnswerHistory((current) => [
                data.answer,
                ...current.filter((answer) => answer.id !== data.answer.id),
            ].slice(0, 6));

            if (['completed', 'completed_with_errors'].includes(data.answer.status)) {
                setLoadingStep('Estudo concluido');
                setAiLoading(false);
                return;
            }

            if (data.answer.status === 'failed') {
                setAiError(data.answer.error ?? 'Nao foi possivel consultar os agentes agora.');
                setAiLoading(false);
                return;
            }

            pollAnswer(answerId, attempt + 1);
        }, attempt < 2 ? 1800 : 3000);
    }

    const selectedVerseIndex = search.results?.findIndex((result) => result.id === selectedVerseId) ?? -1;
    const currentVerseIndex = selectedVerseIndex >= 0 ? selectedVerseIndex : 0;
    const primaryVerse = search.results?.[currentVerseIndex] ?? null;
    const passageLabel = primaryVerse?.reference ?? reference;
    const canSelectPreviousVerse = currentVerseIndex > 0;
    const canSelectNextVerse = currentVerseIndex < (search.results?.length ?? 0) - 1;
    const primaryVerseFavorited = Boolean(primaryVerse && (
        favoriteOverrides[primaryVerse.id] ?? (primaryVerse.isFavorited || favoriteHistory.some((favorite) => favorite.verseId === primaryVerse.id))
    ));

    return (
        <>
            <Head title="Dashboard" />

            <main className="bible-shell">
                <DashboardSidebar stats={statsState} activeLabel={activeNav} onNavigate={handleSidebarNavigate} />

                <section className="bible-main">
                    <TopBar
                        reference={reference}
                        onReferenceChange={setReference}
                        onSubmit={submit}
                        onReadingMode={() => scrollToPanel('bible-reader')}
                    />

                    <section className="study-canvas">
                        <div className="open-book">
                            <div id="bible-reader" className="book-page book-page-left">
                                <div className="breadcrumb-line">
                                    <span>Joao</span>
                                    <span>Capitulo 3</span>
                                    <span>{passageLabel}</span>
                                </div>

                                {primaryVerse ? (
                                    <>
                                        <div className="verse-heading">
                                            <h1>{primaryVerse.reference}</h1>
                                            <button
                                                type="button"
                                                aria-label={primaryVerseFavorited ? 'Versiculo favorito' : 'Favoritar versiculo'}
                                                onClick={togglePrimaryFavorite}
                                                title={primaryVerseFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                                            >
                                                <Star className={`h-4 w-4 ${primaryVerseFavorited ? 'fill-[#8a6117]' : ''}`} />
                                            </button>
                                        </div>
                                        <p className="verse-copy">{primaryVerse.text}</p>
                                        <p className="translation-line">{primaryVerse.translation ?? 'JFA'}</p>

                                        <SpeechPlayer
                                            title="Ouvir capitulo"
                                            description="Leitura dos versiculos encontrados."
                                            items={search.results.map((result) => ({
                                                reference: result.reference,
                                                text: result.text,
                                            }))}
                                            emptyMessage="Nenhum versiculo disponivel para leitura."
                                            compact
                                        />

                                        <div className="book-actions">
                                            <button type="button" onClick={() => selectAdjacentVerse(-1)} disabled={!canSelectPreviousVerse}>
                                                Anterior
                                            </button>
                                            <button type="button" onClick={copyPrimaryVerse}>
                                                {copyStatus || 'Copiar'}
                                            </button>
                                            <button type="button" onClick={() => selectAdjacentVerse(1)} disabled={!canSelectNextVerse}>
                                                Proximo
                                            </button>
                                        </div>

                                        <div className="verse-list">
                                            {search.results.slice(0, 3).map((result) => (
                                                <VerseResult
                                                    key={result.id}
                                                    result={result}
                                                    onSaveNote={saveStudyNote}
                                                    onToggleFavorite={toggleFavorite}
                                                    onOpenReference={openReference}
                                                />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="empty-book-state">
                                        <BookOpen className="h-8 w-8" />
                                        <h1>Joao 3:16</h1>
                                        <p>
                                            {search.term
                                                ? 'Nenhum versiculo foi encontrado para esta busca.'
                                                : 'Busque uma passagem para abrir o texto biblico nesta pagina.'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="book-gutter" />

                            <div className="book-page book-page-right">
                                <div id="ai-study-card" className="ai-card">
                                    <div className="tabs-row">
                                        {tabs.map((tab) => {
                                            const Icon = tab.icon;
                                            const selected = activeTab === tab.name;

                                            return (
                                                <button
                                                    key={tab.name}
                                                    type="button"
                                                    onClick={() => setActiveTab(tab.name)}
                                                    className={selected ? 'selected' : ''}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    {tab.name}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="ai-content">
                                        <PodcastAudioPanel episode={podcastEpisode} hasAnswer={Boolean(aiAnswer)} loading={aiLoading} />
                                        <StudyPanel
                                            title={activeTab}
                                            section={activeSection}
                                            answer={aiAnswer}
                                            loading={aiLoading}
                                            loadingStep={loadingStep}
                                            timeline={primaryVerse?.timeline}
                                            reference={passageLabel}
                                        />

                                        <div className="agent-status-card">
                                            <div className="agent-status-title">
                                                <Sparkles className="h-4 w-4" />
                                                Estado dos agentes
                                            </div>
                                            {aiAnswer?.agents?.length > 0 ? (
                                                <div className="agent-status-list">
                                                    {aiAnswer.agents.map((agent) => (
                                                        <div key={agent.agent}>
                                                            <span>{agent.title}</span>
                                                            <AgentStatus status={agent.status} />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p>Faca uma pergunta para iniciar os agentes de estudo.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <aside className="right-library">
                            <ReadingPlanCard plan={readingPlan} onCompleteDay={completeReadingDay} />

                            <div className="library-card verse-day-card">
                                <div className="card-title-icon">
                                    <BookOpen className="h-5 w-5" />
                                    <h2>Versiculo do Dia</h2>
                                </div>
                                <p>"Entrega o teu caminho ao SENHOR; confia nele, e o mais ele fara."</p>
                                <strong>Salmos 37:5</strong>
                            </div>

                            <form onSubmit={askAgents} className="ask-card">
                                <div className="card-title-icon">
                                    <MessageSquareText className="h-5 w-5" />
                                    <h2>Perguntar</h2>
                                </div>
                                <textarea
                                    value={aiQuestion}
                                    onChange={(event) => setAiQuestion(event.target.value)}
                                    disabled={aiLoading}
                                    rows={4}
                                />
                                {aiLoading && <BibleLoader label={loadingStep} compact />}
                                {aiError && <p className="ask-error">{aiError}</p>}
                                <button type="submit" disabled={aiLoading}>
                                    {aiLoading ? 'Estudo em andamento' : 'Perguntar'}
                                    {aiLoading ? <BookOpen className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
                                </button>
                            </form>

                            <FavoritesCard favorites={favoriteHistory} onOpenFavorite={openNote} />
                            <HistoryCard answers={answerHistory} onOpenAnswer={openAnswer} />
                            <NotesCard notes={noteHistory} onOpenNote={openNote} />
                        </aside>
                    </section>
                </section>
            </main>
        </>
    );
}

function PodcastAudioPanel({ episode = null, hasAnswer = false, loading = false }) {
    const [copied, setCopied] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const stored = window.localStorage.getItem('biblia_abs_podcast_history');

        if (!stored) {
            return;
        }

        try {
            setHistory(JSON.parse(stored).slice(0, 3));
        } catch (error) {
            setHistory([]);
        }
    }, []);

    if (!hasAnswer && !loading) {
        return null;
    }

    if (loading) {
        return (
            <div className="rounded-md border border-[#dbeafe] bg-[#eff6ff] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1e3a8a]">
                    <Headphones className="h-4 w-4" />
                    Modo podcast
                </div>
                <p className="mt-1 text-sm leading-6 text-[#1e40af]">
                    Assim que os agentes concluirem, o sistema montara um episodio devocional completo para ouvir em sequencia.
                </p>
            </div>
        );
    }

    const script = episode?.script ?? '';
    const canCopy = typeof navigator !== 'undefined' && Boolean(navigator.clipboard);
    const canShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

    function saveHistory() {
        if (!episode?.title || typeof window === 'undefined') {
            return;
        }

        const entry = {
            title: episode.title,
            reference: episode.reference,
            duration: episode.durationLabel,
            listenedAt: new Date().toISOString(),
        };

        setHistory((current) => {
            const next = [entry, ...current.filter((item) => item.title !== entry.title)].slice(0, 3);
            window.localStorage.setItem('biblia_abs_podcast_history', JSON.stringify(next));
            return next;
        });
    }

    async function copyScript() {
        if (!script || !canCopy) {
            return;
        }

        await navigator.clipboard.writeText(script);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    }

    async function shareEpisode() {
        if (!canShare || !episode) {
            return;
        }

        await navigator.share({
            title: episode.title,
            text: script.slice(0, 1400),
        });
    }

    return (
        <div className="rounded-md border border-[#d8d7cf] bg-[#fafaf7] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                        <Headphones className="h-4 w-4 text-[#2563eb]" />
                        Modo podcast
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-[#111827]">{episode?.title ?? 'Episodio devocional'}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#4b5563]">{episode?.description ?? 'Gere uma resposta dos agentes para montar o episodio completo.'}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={copyScript}
                        disabled={!script || !canCopy}
                        className="inline-flex h-9 items-center rounded-md border border-[#d1d5db] bg-white px-3 text-sm font-semibold text-[#374151] transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                        {copied ? 'Copiado' : 'Copiar roteiro'}
                    </button>
                    {canShare && (
                        <button
                            type="button"
                            onClick={shareEpisode}
                            disabled={!script}
                            className="inline-flex h-9 items-center rounded-md border border-[#d1d5db] bg-white px-3 text-sm font-semibold text-[#374151] transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Share2 className="mr-2 h-4 w-4" />
                            Compartilhar
                        </button>
                    )}
                </div>
            </div>

            {episode && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Referencia</p>
                        <p className="mt-1 text-sm font-semibold text-[#111827]">{episode.reference}</p>
                    </div>
                    <div className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Duracao estimada</p>
                        <p className="mt-1 text-sm font-semibold text-[#111827]">{episode.durationLabel}</p>
                    </div>
                    <div className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Blocos</p>
                        <p className="mt-1 text-sm font-semibold text-[#111827]">{episode.items.length} secoes</p>
                    </div>
                </div>
            )}

            <div className="mt-4">
                <SpeechPlayer
                    title="Ouvir episodio completo"
                    description="Podcast devocional: pergunta, texto biblico e respostas dos agentes em uma leitura continua."
                    items={episode?.items ?? []}
                    emptyMessage="Gere uma resposta dos agentes para ouvir o episodio completo."
                    onStart={saveHistory}
                />
            </div>

            {episode?.preview?.length > 0 && (
                <details className="mt-4 rounded-md border border-[#e5e7eb] bg-white p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-[#111827]">Ver roteiro resumido</summary>
                    <div className="mt-3 space-y-2 text-sm leading-6 text-[#4b5563]">
                        {episode.preview.map((line, index) => (
                            <p key={`${line}-${index}`}>{line}</p>
                        ))}
                    </div>
                </details>
            )}

            {history.length > 0 && (
                <div className="mt-4 rounded-md border border-[#e5e7eb] bg-white p-3">
                    <p className="text-sm font-semibold text-[#111827]">Historico local de escuta</p>
                    <div className="mt-2 space-y-2">
                        {history.map((item) => (
                            <div key={`${item.title}-${item.listenedAt}`} className="text-sm leading-5 text-[#4b5563]">
                                <span className="font-medium text-[#111827]">{item.title}</span>
                                <span className="block text-xs text-[#6b7280]">{item.duration} • {formatDate(item.listenedAt)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function buildPodcastEpisode({ reference = '', items = [], answer = null }) {
    const readableItems = items
        .map((item) => ({
            reference: item.reference ?? '',
            text: normalizeSpeechText(item.text ?? ''),
        }))
        .filter((item) => item.text);

    if (readableItems.length === 0) {
        return null;
    }

    const question = normalizeSpeechText(answer?.question ?? '');
    const titleBase = question ? question.replace(/[?.!]+$/, '') : `Estudo de ${reference || readableItems[0].reference}`;
    const title = `Podcast devocional: ${titleBase}`;
    const wordCount = readableItems.reduce((total, item) => total + item.text.split(/\s+/).filter(Boolean).length, 0);
    const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 150));
    const durationLabel = estimatedMinutes === 1 ? '1 minuto' : `${estimatedMinutes} minutos`;
    const script = readableItems
        .map((item) => `${item.reference}\n${item.text}`)
        .join('\n\n');

    return {
        title,
        reference: reference || readableItems[0]?.reference || 'Estudo biblico',
        description: 'Episodio montado automaticamente com a pergunta, a passagem biblica e os blocos gerados pelos agentes IA.',
        durationLabel,
        items: readableItems,
        script,
        preview: readableItems.slice(0, 4).map((item) => `${item.reference}: ${item.text.slice(0, 220)}${item.text.length > 220 ? '...' : ''}`),
    };
}

function buildDevotionalAudioItems({ reference = '', searchResults = [], answer = null }) {
    const items = [];

    if (answer?.question) {
        items.push({
            reference: 'Pergunta do estudo',
            text: answer.question,
        });
    }

    const bibleItems = searchResults
        .map((result) => ({
            reference: result.reference ?? reference,
            text: result.text ?? '',
        }))
        .filter((item) => normalizeSpeechText(item.text));

    if (bibleItems.length > 0) {
        items.push({
            reference: 'Texto biblico',
            text: `Passagem base: ${reference || bibleItems[0].reference}.`,
        });
        items.push(...bibleItems);
    }

    const sections = answer?.sections ?? [];

    tabs.forEach((tab) => {
        const section = sections.find((item) => item.agent === tab.agent);

        if (!section?.text) {
            return;
        }

        items.push({
            reference: tab.name,
            text: section.text,
        });
    });

    return items;
}

function SpeechPlayer({
    title = 'Leitor com audio do navegador',
    description = 'Use para ouvir este conteudo sem depender de API paga.',
    items = [],
    emptyMessage = 'Nenhum texto disponivel para leitura.',
    compact = false,
    onStart = null,
}) {
    const synthRef = useRef(null);
    const stopRequestedRef = useRef(false);
    const currentIndexRef = useRef(0);
    const itemsRef = useRef(items);
    const [supported, setSupported] = useState(null);
    const [voices, setVoices] = useState([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
    const [rate, setRate] = useState(1);
    const [status, setStatus] = useState('idle');
    const [currentIndex, setCurrentIndex] = useState(null);

    const readableItems = useMemo(() => items
        .map((item) => ({
            reference: item?.reference ?? '',
            text: normalizeSpeechText(item?.text ?? ''),
        }))
        .filter((item) => item.text), [items]);
    const currentReference = currentIndex !== null ? readableItems[currentIndex]?.reference : null;

    useEffect(() => {
        itemsRef.current = readableItems;
    }, [readableItems]);

    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
            setSupported(false);
            return undefined;
        }

        synthRef.current = window.speechSynthesis;
        setSupported(true);

        function loadVoices() {
            const availableVoices = synthRef.current?.getVoices() ?? [];
            setVoices(availableVoices);

            if (availableVoices.length > 0) {
                const preferredVoice = availableVoices.find((voice) => voice.lang === 'pt-BR')
                    ?? availableVoices.find((voice) => voice.lang?.startsWith('pt'))
                    ?? availableVoices[0];

                setSelectedVoiceURI((current) => current || preferredVoice.voiceURI);
            }
        }

        loadVoices();
        synthRef.current.onvoiceschanged = loadVoices;

        return () => {
            stopRequestedRef.current = true;
            synthRef.current?.cancel();
            if (synthRef.current) {
                synthRef.current.onvoiceschanged = null;
            }
        };
    }, []);

    useEffect(() => {
        stopAudio();
    }, [readableItems.length]);

    function getSelectedVoice() {
        return voices.find((voice) => voice.voiceURI === selectedVoiceURI) ?? null;
    }

    function speakAt(index) {
        const synth = synthRef.current;
        const current = itemsRef.current[index];

        if (!synth || !current) {
            setStatus('idle');
            setCurrentIndex(null);
            return;
        }

        currentIndexRef.current = index;
        setCurrentIndex(index);
        setStatus('playing');

        const textToRead = current.reference ? `${current.reference}. ${current.text}` : current.text;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = getSelectedVoice()?.lang ?? 'pt-BR';
        utterance.voice = getSelectedVoice();
        utterance.rate = Number(rate);
        utterance.pitch = 1;

        utterance.onend = () => {
            if (stopRequestedRef.current) {
                return;
            }

            const nextIndex = currentIndexRef.current + 1;

            if (nextIndex < itemsRef.current.length) {
                speakAt(nextIndex);
                return;
            }

            setStatus('done');
            setCurrentIndex(null);
        };

        utterance.onerror = () => {
            setStatus('idle');
            setCurrentIndex(null);
        };

        synth.speak(utterance);
    }

    function startAudio() {
        if (!supported || readableItems.length === 0) {
            return;
        }

        stopRequestedRef.current = false;
        synthRef.current?.cancel();
        onStart?.();
        speakAt(0);
    }

    function pauseAudio() {
        synthRef.current?.pause();
        setStatus('paused');
    }

    function resumeAudio() {
        synthRef.current?.resume();
        setStatus('playing');
    }

    function stopAudio() {
        stopRequestedRef.current = true;
        synthRef.current?.cancel();
        setStatus('idle');
        setCurrentIndex(null);
    }

    if (supported === null) {
        return null;
    }

    if (!supported) {
        return (
            <div className="rounded-md border border-[#fee2e2] bg-[#fef2f2] p-4 text-sm leading-6 text-[#991b1b]">
                Este navegador nao disponibilizou leitura por voz nativa. Tente Chrome, Edge ou Safari atualizado.
            </div>
        );
    }

    if (compact) {
        const isPlaying = status === 'playing';
        const isPaused = status === 'paused';

        return (
            <div className="mini-speech-player">
                <button
                    type="button"
                    onClick={isPaused ? resumeAudio : startAudio}
                    disabled={isPlaying || readableItems.length === 0}
                    aria-label={isPaused ? 'Continuar leitura' : title}
                >
                    <Play className="h-4 w-4" />
                </button>
                <div className="mini-speech-copy">
                    <strong>{title}</strong>
                    <span>
                        {isPlaying && currentReference
                            ? `Lendo agora: ${currentReference}`
                            : readableItems.length > 0 ? description : emptyMessage}
                    </span>
                    <div className="mini-progress">
                        <span className={isPlaying ? 'playing' : ''} />
                    </div>
                </div>
                {['playing', 'paused'].includes(status) && (
                    <button type="button" onClick={stopAudio} aria-label="Parar leitura">
                        <Square className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`rounded-md border border-[#dbeafe] bg-[#eff6ff] ${compact ? 'p-3' : 'p-4'}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#1e3a8a]">
                        <Volume2 className="h-4 w-4" />
                        {title}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#1e40af]">
                        {status === 'playing' && currentReference
                            ? `Lendo agora: ${currentReference}`
                            : readableItems.length > 0 ? description : emptyMessage}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={startAudio}
                        disabled={status === 'playing' || readableItems.length === 0}
                        className="inline-flex h-9 items-center rounded-md bg-[#2563eb] px-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        Ouvir
                    </button>
                    {status === 'playing' ? (
                        <button
                            type="button"
                            onClick={pauseAudio}
                            className="inline-flex h-9 items-center rounded-md border border-[#93c5fd] bg-white px-3 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
                        >
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={resumeAudio}
                            disabled={status !== 'paused'}
                            className="inline-flex h-9 items-center rounded-md border border-[#93c5fd] bg-white px-3 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Play className="mr-2 h-4 w-4" />
                            Continuar
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={stopAudio}
                        disabled={!['playing', 'paused'].includes(status)}
                        className="inline-flex h-9 items-center rounded-md border border-[#cbd5e1] bg-white px-3 text-sm font-semibold text-[#334155] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Square className="mr-2 h-4 w-4" />
                        Parar
                    </button>
                </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#1e40af]">
                    Voz
                    <select
                        value={selectedVoiceURI}
                        onChange={(event) => setSelectedVoiceURI(event.target.value)}
                        className="mt-1 h-10 w-full rounded-md border border-[#bfdbfe] bg-white px-3 text-sm normal-case tracking-normal text-[#111827] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
                    >
                        {voices.map((voice) => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                                {voice.name} ({voice.lang})
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-[#1e40af]">
                    Velocidade
                    <select
                        value={rate}
                        onChange={(event) => setRate(Number(event.target.value))}
                        className="mt-1 h-10 w-full rounded-md border border-[#bfdbfe] bg-white px-3 text-sm normal-case tracking-normal text-[#111827] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
                    >
                        <option value={0.8}>0.8x</option>
                        <option value={1}>1x</option>
                        <option value={1.2}>1.2x</option>
                        <option value={1.4}>1.4x</option>
                    </select>
                </label>
            </div>
        </div>
    );
}

function normalizeSpeechText(value) {
    return String(value ?? '')
        .replace(/^#+\s*/gm, '')
        .replace(/[*_`>]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function StudyPanel({ title, section, answer, loading, loadingStep, timeline = null, reference = '' }) {
    if (loading && ['queued', 'running'].includes(answer?.status)) {
        return (
            <div className="rounded-md border border-[#e4e2da] p-4">
                <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
                <BibleLoader label={loadingStep} />
            </div>
        );
    }

    if (section?.text) {
        return (
            <div className="rounded-md border border-[#e4e2da] p-4">
                <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
                {section.status === 'failed' && (
                    <p className="mt-3 rounded-md bg-[#fef2f2] px-3 py-2 text-sm leading-5 text-[#b91c1c]">
                        Esta secao falhou nesta tentativa, mas o restante do estudo foi preservado.
                    </p>
                )}
                <div className="mt-4">
                    <SpeechPlayer
                        title={`Ouvir ${title}`}
                        description={`Use para ouvir a secao ${title} gerada pelos agentes IA.`}
                        items={[{ reference: title, text: section.text }]}
                        emptyMessage="Esta secao ainda nao tem texto para leitura."
                        compact
                    />
                </div>
                <div className="mt-3 max-h-[420px] space-y-3 overflow-auto pr-2 text-sm leading-6 text-[#374151]">
                    {section.text.split('\n').filter(Boolean).map((line, index) => (
                        <p key={`${line}-${index}`}>{line.replace(/^#+\s*/, '')}</p>
                    ))}
                </div>
                {answer.citations?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {answer.citations.map((citation) => (
                            <span key={`${citation.reference}-${citation.translation}`} className="rounded-md bg-[#eef2ff] px-2 py-1 text-xs font-semibold text-[#3730a3]">
                                {citation.reference}
                            </span>
                        ))}
                    </div>
                )}
                {section.agent === 'study' && <StudyTools text={section.text} />}
                {section.agent === 'chronology' && <ChronologyContext timeline={timeline} reference={reference} />}
            </div>
        );
    }

    if (answer?.sections?.length > 0) {
        return (
            <div className="rounded-md border border-[#e4e2da] p-4">
                <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
                {title === 'Cronologia' && <ChronologyContext timeline={timeline} reference={reference} />}
                <p className="mt-3 text-sm leading-6 text-[#4b5563]">
                    Este agente ainda nao retornou conteudo para esta pergunta.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-[#e4e2da] p-4">
            <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
            {title === 'Cronologia' && <ChronologyContext timeline={timeline} reference={reference} />}
            <p className="mt-3 text-sm leading-6 text-[#4b5563]">
                Este espaco recebera respostas fundamentadas, contexto historico, referencias cruzadas e aplicacoes praticas.
            </p>
        </div>
    );
}

function BibleLoader({ label, compact = false }) {
    return (
        <div className={`${compact ? 'mt-3' : 'mt-4'} rounded-md border border-[#dbeafe] bg-[#eff6ff] p-4`}>
            <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-12 items-center justify-center">
                    <div className="absolute h-8 w-5 origin-right animate-pulse rounded-l-md border border-[#2563eb] bg-white" />
                    <div className="absolute h-8 w-5 translate-x-4 origin-left animate-pulse rounded-r-md border border-[#2563eb] bg-white" />
                    <BookOpen className="relative h-5 w-5 text-[#2563eb]" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1e3a8a]">{label}</p>
                    <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-[#bfdbfe]">
                        <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-[#2563eb]" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function AgentStatus({ status }) {
    if (status === 'running') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#eff6ff] px-2 py-0.5 text-xs font-semibold text-[#1d4ed8]">
                <MiniBibleLoader />
                Analisando
            </span>
        );
    }

    const statusMap = {
        completed: {
            label: 'Concluido',
            className: 'bg-[#ecfdf5] text-[#047857]',
        },
        failed: {
            label: 'Falhou',
            className: 'bg-[#fef2f2] text-[#b91c1c]',
        },
        queued: {
            label: 'Na fila',
            className: 'bg-[#fefce8] text-[#a16207]',
        },
        pending: {
            label: 'Pendente',
            className: 'bg-[#f3f4f6] text-[#4b5563]',
        },
    };

    const current = statusMap[status] ?? {
        label: status,
        className: 'bg-[#f3f4f6] text-[#4b5563]',
    };

    return (
        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${current.className}`}>
            {current.label}
        </span>
    );
}

function MiniBibleLoader() {
    return (
        <span className="relative inline-flex h-4 w-5 items-center justify-center">
            <span className="absolute h-3.5 w-2 origin-right animate-pulse rounded-l-sm border border-[#2563eb] bg-white" />
            <span className="absolute h-3.5 w-2 translate-x-1.5 origin-left animate-pulse rounded-r-sm border border-[#2563eb] bg-white" />
            <BookOpen className="relative h-3 w-3 text-[#2563eb]" />
        </span>
    );
}
