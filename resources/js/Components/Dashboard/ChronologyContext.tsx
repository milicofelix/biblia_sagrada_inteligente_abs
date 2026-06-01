import { CalendarDays, ChevronLeft, ChevronRight, Milestone } from 'lucide-react';

import type { BiblicalTimeline } from '../../types/dashboard';

type ChronologyContextProps = {
    timeline?: BiblicalTimeline | null;
    reference?: string;
};

export function ChronologyContext({ timeline, reference = '' }: ChronologyContextProps) {
    if (!timeline) {
        return (
            <div className="mt-4 rounded-md border border-[#e4e2da] bg-[#fafaf7] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                    <CalendarDays className="h-4 w-4 text-[#2f5d3a]" />
                    Cronologia biblica
                </div>
                <p className="mt-2 text-sm leading-6 text-[#4b5563]">
                    Busque uma passagem importada para posiciona-la na grande narrativa biblica.
                </p>
            </div>
        );
    }

    const progress = Math.round((timeline.phase.position / timeline.phase.total) * 100);

    return (
        <div className="mt-4 rounded-md border border-[#d8d7cf] bg-[#fafaf7] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                        <CalendarDays className="h-4 w-4 text-[#2f5d3a]" />
                        Cronologia biblica
                    </div>
                    <h4 className="mt-2 text-base font-semibold text-[#111827]">{timeline.phase.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-[#4b5563]">{timeline.phase.period}</p>
                </div>
                <span className="inline-flex rounded-md bg-white px-3 py-1 text-xs font-semibold text-[#2f5d3a] ring-1 ring-[#d8d7cf]">
                    {reference || timeline.book} · {timeline.testament}
                </span>
            </div>

            <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold uppercase text-[#6b7280]">
                    <span>Inicio</span>
                    <span>Fase {timeline.phase.position} de {timeline.phase.total}</span>
                    <span>Consumacao</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4e2da]">
                    <span className="block h-full rounded-full bg-[#2f5d3a]" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#374151]">{timeline.phase.summary}</p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
                <TimelineNeighbor
                    icon="previous"
                    title={timeline.previousPhase?.title ?? 'Antes desta fase'}
                    period={timeline.previousPhase?.period ?? 'Esta passagem esta no inicio da linha narrativa.'}
                />
                <div className="rounded-md border border-[#2f5d3a]/30 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                        <Milestone className="h-4 w-4 text-[#2f5d3a]" />
                        Passagem atual
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#374151]">
                        {timeline.book} {timeline.chapter}:{timeline.verse} dentro de {timeline.phase.title}.
                    </p>
                </div>
                <TimelineNeighbor
                    icon="next"
                    title={timeline.nextPhase?.title ?? 'Depois desta fase'}
                    period={timeline.nextPhase?.period ?? 'Esta passagem aponta para a consumacao da historia biblica.'}
                />
            </div>
        </div>
    );
}

function TimelineNeighbor({ icon, title, period }: { icon: 'previous' | 'next'; title: string; period: string }) {
    const Icon = icon === 'previous' ? ChevronLeft : ChevronRight;

    return (
        <div className="rounded-md border border-[#e4e2da] bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                <Icon className="h-4 w-4 text-[#6b7280]" />
                {title}
            </div>
            <p className="mt-2 text-sm leading-6 text-[#4b5563]">{period}</p>
        </div>
    );
}
