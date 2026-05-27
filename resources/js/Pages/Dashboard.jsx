import { Head, router } from '@inertiajs/react';
import {
    BookOpen,
    Brain,
    CalendarDays,
    ChevronRight,
    GitBranch,
    Library,
    ListChecks,
    MessageSquareText,
    NotebookPen,
    Search,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';

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
];

const tabs = [
    { name: 'IA Explica', icon: Brain },
    { name: 'Contexto', icon: BookOpen },
    { name: 'Referencias', icon: GitBranch },
    { name: 'Notas', icon: NotebookPen },
];

export default function Dashboard({ initialReference = 'Joao 3:16', search = { term: '', results: [] }, stats = {} }) {
    const [reference, setReference] = useState(initialReference);
    const [activeTab, setActiveTab] = useState(tabs[0].name);

    function submit(event) {
        event.preventDefault();

        router.get('/buscar', { q: reference }, {
            preserveScroll: true,
            preserveState: true,
            only: [],
        });
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
                            <Metric label="Livros catalogados" value={stats.books ?? 0} />
                            <Metric label="Versiculos indexados" value={stats.verses ?? 0} />
                            <Metric label="Notas de estudo" value={stats.notes ?? 0} />
                            <Metric label="Execucoes de agentes" value={stats.agentRuns ?? 0} />
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
                                        {search.results.map((result) => (
                                            <article key={result.id} className="rounded-md border border-[#e4e2da] p-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-semibold text-[#111827]">{result.reference}</h3>
                                                    {result.translation && (
                                                        <span className="rounded-md bg-[#eef2ff] px-2 py-0.5 text-xs font-medium text-[#3730a3]">
                                                            {result.translation}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-3 text-base leading-8 text-[#374151]">{result.text}</p>
                                            </article>
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

                            <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                                <StudyPanel title={activeTab} />
                                <div className="rounded-md border border-[#e4e2da] bg-[#fafaf7] p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                                        <Sparkles className="h-4 w-4 text-[#2563eb]" />
                                        Proxima acao
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-[#4b5563]">
                                        Conectar o pipeline de busca aos versiculos e depois despachar analises para a fila.
                                    </p>
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

                        <div className="rounded-md border border-[#d8d7cf] bg-[#111827] p-4 text-white">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <MessageSquareText className="h-4 w-4 text-[#93c5fd]" />
                                Pergunta exemplo
                            </div>
                            <p className="mt-3 text-sm leading-6 text-[#d1d5db]">
                                Estou desanimado, existe algo na Biblia sobre perseveranca?
                            </p>
                            <button className="mt-4 inline-flex h-9 items-center rounded-md bg-white px-3 text-sm font-semibold text-[#111827]">
                                Usar exemplo
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </button>
                        </div>
                    </aside>
                </section>
            </main>
        </>
    );
}

function Metric({ label, value }) {
    return (
        <div className="rounded-md border border-[#d8d7cf] bg-white px-4 py-3">
            <p className="text-sm text-[#6b7280]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#111827]">{value}</p>
        </div>
    );
}

function StudyPanel({ title }) {
    return (
        <div className="rounded-md border border-[#e4e2da] p-4">
            <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#4b5563]">
                Este espaco recebera respostas fundamentadas, contexto historico, referencias cruzadas e aplicacoes praticas.
            </p>
        </div>
    );
}
