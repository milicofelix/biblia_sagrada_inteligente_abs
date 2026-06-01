import { useMemo, useState } from 'react';

import { BookOpenCheck, CheckCircle2, HelpCircle, Layers3, RotateCcw } from 'lucide-react';

import { parseStudyTools } from '../../utils/studyTools';

type StudyToolsProps = {
    text: string;
};

const modes = [
    { key: 'summary', label: 'Resumo', icon: BookOpenCheck },
    { key: 'flashcards', label: 'Flashcards', icon: Layers3 },
    { key: 'quiz', label: 'Quiz', icon: HelpCircle },
] as const;

export function StudyTools({ text }: StudyToolsProps) {
    const parsed = useMemo(() => parseStudyTools(text), [text]);
    const [mode, setMode] = useState<(typeof modes)[number]['key']>('summary');
    const [revealedCards, setRevealedCards] = useState<number[]>([]);
    const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);

    function toggleCard(index: number) {
        setRevealedCards((current) => (
            current.includes(index)
                ? current.filter((item) => item !== index)
                : [...current, index]
        ));
    }

    function toggleQuestion(index: number) {
        setAnsweredQuestions((current) => (
            current.includes(index)
                ? current.filter((item) => item !== index)
                : [...current, index]
        ));
    }

    return (
        <div className="mt-4 rounded-md border border-[#d8d7cf] bg-[#fafaf7] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-[#111827]">Ferramentas de estudo</p>
                    <p className="mt-1 text-sm leading-6 text-[#4b5563]">Revise o estudo em formatos rapidos para memorizacao.</p>
                </div>
                <div className="inline-flex rounded-md border border-[#d8d7cf] bg-white p-1">
                    {modes.map((item) => {
                        const Icon = item.icon;
                        const selected = mode === item.key;

                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setMode(item.key)}
                                className={`inline-flex h-9 items-center rounded-md px-2.5 text-sm font-semibold transition ${
                                    selected ? 'bg-[#2f5d3a] text-white' : 'text-[#4b5563] hover:bg-[#f3f4f6]'
                                }`}
                            >
                                <Icon className="mr-1.5 h-4 w-4" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {mode === 'summary' && (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <StudyList title="Resumo" items={parsed.summary} empty="O agente ainda nao trouxe um resumo claro." />
                    <StudyList title="Pontos principais" items={parsed.keyPoints} empty="Os pontos principais aparecerao aqui." />
                    {parsed.readingPlan.length > 0 && (
                        <div className="lg:col-span-2">
                            <StudyList title="Plano curto" items={parsed.readingPlan} empty="Sem plano sugerido neste estudo." />
                        </div>
                    )}
                </div>
            )}

            {mode === 'flashcards' && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {parsed.flashcards.length > 0 ? parsed.flashcards.map((card, index) => {
                        const revealed = revealedCards.includes(index);

                        return (
                            <button
                                key={`${card.front}-${index}`}
                                type="button"
                                onClick={() => toggleCard(index)}
                                className="min-h-32 rounded-md border border-[#e4e2da] bg-white p-4 text-left transition hover:border-[#2f5d3a] hover:bg-[#f8faf7]"
                            >
                                <span className="text-xs font-semibold uppercase text-[#6b7280]">{revealed ? 'Resposta' : 'Pergunta'}</span>
                                <p className="mt-2 text-sm font-semibold leading-6 text-[#111827]">
                                    {revealed ? card.back : card.front}
                                </p>
                                <span className="mt-3 inline-flex items-center text-xs font-semibold text-[#2f5d3a]">
                                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                    Virar card
                                </span>
                            </button>
                        );
                    }) : (
                        <p className="rounded-md border border-[#e4e2da] bg-white p-4 text-sm leading-6 text-[#4b5563]">
                            Os flashcards aparecerao aqui quando o agente retornar perguntas e respostas.
                        </p>
                    )}
                </div>
            )}

            {mode === 'quiz' && (
                <div className="mt-4 space-y-3">
                    {parsed.quiz.length > 0 ? parsed.quiz.map((question, index) => {
                        const answered = answeredQuestions.includes(index);

                        return (
                            <div key={`${question}-${index}`} className="rounded-md border border-[#e4e2da] bg-white p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <p className="text-sm font-semibold leading-6 text-[#111827]">{question}</p>
                                    <button
                                        type="button"
                                        onClick={() => toggleQuestion(index)}
                                        className={`inline-flex h-9 shrink-0 items-center rounded-md px-3 text-sm font-semibold transition ${
                                            answered
                                                ? 'bg-[#ecfdf5] text-[#047857]'
                                                : 'border border-[#d1d5db] bg-white text-[#374151] hover:bg-[#f9fafb]'
                                        }`}
                                    >
                                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                        {answered ? 'Revisada' : 'Marcar revisada'}
                                    </button>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="rounded-md border border-[#e4e2da] bg-white p-4 text-sm leading-6 text-[#4b5563]">
                            As perguntas de revisao aparecerao aqui quando estiverem disponiveis.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function StudyList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
    return (
        <div className="rounded-md border border-[#e4e2da] bg-white p-4">
            <h4 className="text-sm font-semibold text-[#111827]">{title}</h4>
            {items.length > 0 ? (
                <ul className="mt-3 space-y-2">
                    {items.map((item, index) => (
                        <li key={`${item}-${index}`} className="text-sm leading-6 text-[#374151]">
                            {item}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-sm leading-6 text-[#4b5563]">{empty}</p>
            )}
        </div>
    );
}
