import { Head, router } from '@inertiajs/react';
import {
    BookOpen,
    Brain,
    CalendarDays,
    Check,
    Clock3,
    Copy,
    GitBranch,
    Library,
    ListChecks,
    MessageSquareText,
    NotebookPen,
    Pause,
    Headphones,
    Play,
    Save,
    Send,
    Search,
    Share2,
    Sparkles,
    Square,
    Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
}) {
    const [reference, setReference] = useState(initialReference);
    const [activeTab, setActiveTab] = useState(tabs[0].name);
    const [statsState, setStatsState] = useState(stats);
    const [aiQuestion, setAiQuestion] = useState('Estou desanimado, existe algo na Biblia sobre perseveranca?');
    const [aiAnswer, setAiAnswer] = useState(null);
    const [answerHistory, setAnswerHistory] = useState(recentAnswers);
    const [noteHistory, setNoteHistory] = useState(recentNotes);
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
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
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
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
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

    function openNote(note) {
        if (note.reference) {
            setReference(note.reference);
            router.get('/buscar', { q: note.reference }, {
                preserveScroll: true,
            });
        }
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

    return (
        <>
            <Head title="Dashboard" />

            <main className="min-h-screen bg-[#f7f7f4] text-[#1f2933]">
                <section className="border-b border-[#d8d7cf] bg-[#fbfbf8]">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#6b7280]">Biblia Sagrada Inteligente ABS</p>
                                <h1 className="mt-1 text-2xl font-semibold text-[#111827]">
                                    Mesa de estudo biblico com agentes IA
                                </h1>
                            </div>

                            <form onSubmit={submit} className="flex w-full max-w-xl items-center gap-2">
                                <label className="relative flex-1">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7280]" />
                                    <input
                                        value={reference}
                                        onChange={(event) => setReference(event.target.value)}
                                        placeholder="Buscar passagem, tema ou pergunta"
                                        className="h-11 w-full rounded-md border border-[#c7c6bd] bg-white pl-10 pr-3 text-sm text-[#111827] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
                                    />
                                </label>
                                <button
                                    type="submit"
                                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#2563eb] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#93c5fd]"
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    Buscar
                                </button>
                            </form>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Metric label="Livros catalogados" value={statsState.books ?? 0} />
                            <Metric label="Versiculos indexados" value={statsState.verses ?? 0} />
                            <Metric label="Notas de estudo" value={statsState.notes ?? 0} />
                            <Metric label="Execucoes de agentes" value={statsState.agentRuns ?? 0} />
                        </div>
                    </div>
                </section>

                <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
                    <div className="space-y-6">
                        <div className="rounded-md border border-[#d8d7cf] bg-white">
                            <div className="flex items-center justify-between border-b border-[#e4e2da] px-5 py-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-[#111827]">Texto biblico</h2>
                                    <p className="mt-1 text-sm text-[#6b7280]">A importacao da Biblia vai preencher este painel.</p>
                                </div>
                                <span className="rounded-md bg-[#e0f2fe] px-2.5 py-1 text-xs font-semibold text-[#075985]">
                                    FULLTEXT inicial
                                </span>
                            </div>

                            <div className="px-5 py-6">
                                {search.results?.length > 0 ? (
                                    <div className="space-y-4">
                                        <SpeechPlayer
                                            title="Leitor do texto biblico"
                                            description="Use para ouvir os versiculos encontrados sem depender de API paga."
                                            items={search.results.map((result) => ({
                                                reference: result.reference,
                                                text: result.text,
                                            }))}
                                            emptyMessage="Nenhum versiculo disponivel para leitura."
                                        />
                                        {search.results.map((result) => (
                                            <VerseResult key={result.id} result={result} onSaveNote={saveStudyNote} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="max-w-3xl text-base leading-8 text-[#374151]">
                                        {search.term
                                            ? 'Nenhum versiculo foi encontrado ainda. Depois da importacao, os resultados aparecerao aqui.'
                                            : 'Quando os versiculos forem importados, a busca exibira aqui a passagem encontrada, mantendo traducao, livro, capitulo, versiculo e relevancia textual para alimentar os agentes.'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-md border border-[#d8d7cf] bg-white">
                            <div className="flex flex-wrap gap-2 border-b border-[#e4e2da] px-4 py-3">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const selected = activeTab === tab.name;

                                    return (
                                        <button
                                            key={tab.name}
                                            type="button"
                                            onClick={() => setActiveTab(tab.name)}
                                            className={`inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition ${
                                                selected
                                                    ? 'bg-[#111827] text-white'
                                                    : 'text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827]'
                                            }`}
                                        >
                                            <Icon className="mr-2 h-4 w-4" />
                                            {tab.name}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-4 px-5 py-5">
                                <PodcastAudioPanel episode={podcastEpisode} hasAnswer={Boolean(aiAnswer)} loading={aiLoading} />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <StudyPanel title={activeTab} section={activeSection} answer={aiAnswer} loading={aiLoading} loadingStep={loadingStep} />
                                <div className="rounded-md border border-[#e4e2da] bg-[#fafaf7] p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                                        <Sparkles className="h-4 w-4 text-[#2563eb]" />
                                        Estado dos agentes
                                    </div>
                                    {aiAnswer?.agents?.length > 0 ? (
                                        <div className="mt-3 space-y-2">
                                            {aiAnswer.agents.map((agent) => (
                                                <div key={agent.agent} className="flex items-center justify-between gap-3 text-sm">
                                                    <span className="truncate text-[#4b5563]">{agent.title}</span>
                                                    <AgentStatus status={agent.status} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-3 text-sm leading-6 text-[#4b5563]">
                                            Faca uma pergunta para gerar contexto, conexoes, aplicacao, cronologia e estudo.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>

                    <aside className="space-y-4">
                        <div className="rounded-md border border-[#d8d7cf] bg-white">
                            <div className="border-b border-[#e4e2da] px-4 py-3">
                                <h2 className="text-base font-semibold text-[#111827]">Agentes</h2>
                            </div>
                            <div className="divide-y divide-[#ecebe4]">
                                {agents.map((agent) => {
                                    const Icon = agent.icon;

                                    return (
                                        <div key={agent.name} className="flex gap-3 px-4 py-4">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#eef2ff] text-[#3730a3]">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="truncate text-sm font-semibold text-[#111827]">{agent.name}</h3>
                                                    <span className="rounded-md bg-[#ecfdf5] px-2 py-0.5 text-xs font-medium text-[#047857]">
                                                        {agent.status}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm leading-5 text-[#6b7280]">{agent.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <form onSubmit={askAgents} className="rounded-md border border-[#d8d7cf] bg-[#111827] p-4 text-white">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <MessageSquareText className="h-4 w-4 text-[#93c5fd]" />
                                Perguntar aos agentes
                            </div>
                            <textarea
                                value={aiQuestion}
                                onChange={(event) => setAiQuestion(event.target.value)}
                                disabled={aiLoading}
                                rows="5"
                                className="mt-3 w-full resize-none rounded-md border border-[#374151] bg-[#1f2937] px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-[#9ca3af] focus:border-[#93c5fd] focus:ring-2 focus:ring-[#1d4ed8] disabled:opacity-70"
                            />
                            {aiLoading && <BibleLoader label={loadingStep} compact />}
                            {aiError && (
                                <p className="mt-3 rounded-md bg-[#7f1d1d] px-3 py-2 text-sm leading-5 text-[#fee2e2]">{aiError}</p>
                            )}
                            <button
                                type="submit"
                                disabled={aiLoading}
                                className="mt-4 inline-flex h-9 items-center rounded-md bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {aiLoading ? 'Estudo em andamento' : 'Perguntar'}
                                {aiLoading ? <BookOpen className="ml-2 h-4 w-4 animate-pulse" /> : <Send className="ml-2 h-4 w-4" />}
                            </button>
                        </form>

                        <div className="rounded-md border border-[#d8d7cf] bg-white">
                            <div className="flex items-center gap-2 border-b border-[#e4e2da] px-4 py-3">
                                <Clock3 className="h-4 w-4 text-[#2563eb]" />
                                <h2 className="text-base font-semibold text-[#111827]">Historico</h2>
                            </div>
                            {answerHistory.length > 0 ? (
                                <div className="divide-y divide-[#ecebe4]">
                                    {answerHistory.map((answer) => (
                                        <button
                                            key={answer.id}
                                            type="button"
                                            onClick={() => openAnswer(answer)}
                                            className="block w-full px-4 py-3 text-left transition hover:bg-[#f9fafb]"
                                        >
                                            <span className="line-clamp-2 text-sm font-medium leading-5 text-[#111827]">
                                                {answer.question}
                                            </span>
                                            <span className="mt-1 block text-xs text-[#6b7280]">
                                                {formatDate(answer.createdAt)} · {answer.sections?.length ?? 0} secoes
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="px-4 py-4 text-sm leading-6 text-[#6b7280]">
                                    Os estudos gerados aparecerao aqui.
                                </p>
                            )}
                        </div>

                        <div className="rounded-md border border-[#d8d7cf] bg-white">
                            <div className="flex items-center gap-2 border-b border-[#e4e2da] px-4 py-3">
                                <NotebookPen className="h-4 w-4 text-[#2563eb]" />
                                <h2 className="text-base font-semibold text-[#111827]">Caderno</h2>
                            </div>
                            {noteHistory.length > 0 ? (
                                <div className="divide-y divide-[#ecebe4]">
                                    {noteHistory.map((note) => (
                                        <button
                                            key={note.id}
                                            type="button"
                                            onClick={() => openNote(note)}
                                            className="block w-full px-4 py-3 text-left transition hover:bg-[#f9fafb]"
                                        >
                                            <span className="text-sm font-semibold text-[#111827]">{note.reference}</span>
                                            {note.translation && (
                                                <span className="ml-2 rounded-md bg-[#eef2ff] px-2 py-0.5 text-xs font-medium text-[#3730a3]">
                                                    {note.translation}
                                                </span>
                                            )}
                                            <span className="mt-2 line-clamp-3 block text-sm leading-5 text-[#4b5563]">
                                                {note.body}
                                            </span>
                                            <span className="mt-1 block text-xs text-[#6b7280]">{formatDate(note.createdAt)}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="px-4 py-4 text-sm leading-6 text-[#6b7280]">
                                    Suas notas salvas aparecerao aqui.
                                </p>
                            )}
                        </div>
                    </aside>
                </section>
            </main>
        </>
    );
}

function formatDate(value) {
    if (!value) {
        return 'Agora';
    }

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

function Metric({ label, value }) {
    return (
        <div className="rounded-md border border-[#d8d7cf] bg-white px-4 py-3">
            <p className="text-sm text-[#6b7280]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#111827]">{value}</p>
        </div>
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

function VerseResult({ result, onSaveNote }) {
    const [noteBody, setNoteBody] = useState(result.latestNote?.body ?? '');
    const [noteStatus, setNoteStatus] = useState(result.latestNote ? 'Salva' : '');
    const [saving, setSaving] = useState(false);

    async function submitNote(event) {
        event.preventDefault();

        const body = noteBody.trim();

        if (!body) {
            setNoteStatus('Digite uma nota antes de salvar.');
            return;
        }

        setSaving(true);
        setNoteStatus('');

        try {
            await onSaveNote(result.id, body);
            setNoteStatus('Nota salva');
        } catch (error) {
            setNoteStatus(error.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <article className="rounded-md border border-[#e4e2da] p-4">
            <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-[#111827]">{result.reference}</h3>
                {result.translation && (
                    <span className="rounded-md bg-[#eef2ff] px-2 py-0.5 text-xs font-medium text-[#3730a3]">
                        {result.translation}
                    </span>
                )}
            </div>
            <p className="mt-3 text-base leading-8 text-[#374151]">{result.text}</p>

            <form onSubmit={submitNote} className="mt-4 rounded-md border border-[#e5e7eb] bg-[#fafaf7] p-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                    <NotebookPen className="h-4 w-4 text-[#2563eb]" />
                    Nota de estudo
                </label>
                <textarea
                    value={noteBody}
                    onChange={(event) => setNoteBody(event.target.value)}
                    rows="3"
                    placeholder="Escreva uma observacao, aplicacao ou pergunta sobre este versiculo."
                    className="mt-3 w-full resize-none rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm leading-6 text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex h-9 items-center rounded-md bg-[#111827] px-3 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {saving ? 'Salvando...' : 'Salvar nota'}
                        <Save className="ml-2 h-4 w-4" />
                    </button>
                    {noteStatus && <span className="text-sm text-[#4b5563]">{noteStatus}</span>}
                </div>
            </form>
        </article>
    );
}

function StudyPanel({ title, section, answer, loading, loadingStep }) {
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
            </div>
        );
    }

    if (answer?.sections?.length > 0) {
        return (
            <div className="rounded-md border border-[#e4e2da] p-4">
                <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#4b5563]">
                    Este agente ainda nao retornou conteudo para esta pergunta.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-[#e4e2da] p-4">
            <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
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
