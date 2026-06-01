import { BookOpen, CalendarDays, Clock3, NotebookPen, Star } from 'lucide-react';
import { useState } from 'react';

import type { AiAnswer, ReadingPlan, StudyNote, VerseFavorite } from '../../types/dashboard';
import { formatDate } from '../../utils/date';

type HistoryCardProps = {
    answers: AiAnswer[];
    onOpenAnswer: (answer: AiAnswer) => void;
};

type NotesCardProps = {
    notes: StudyNote[];
    onOpenNote: (note: StudyNote) => void;
};

type FavoritesCardProps = {
    favorites: VerseFavorite[];
    onOpenFavorite: (favorite: VerseFavorite) => void;
};

type ReadingPlanCardProps = {
    plan: ReadingPlan | null;
    onCompleteDay: (dayId: number) => Promise<ReadingPlan>;
};

export function HistoryCard({ answers, onOpenAnswer }: HistoryCardProps) {
    return (
        <div id="history-card" className="library-card compact-list-card">
            <div className="card-title-icon">
                <Clock3 className="h-5 w-5" />
                <h2>Historico</h2>
            </div>
            {answers.length > 0 ? (
                <div className="compact-list">
                    {answers.map((answer) => (
                        <button key={answer.id} type="button" onClick={() => onOpenAnswer(answer)}>
                            <span>{answer.question}</span>
                            <small>{formatDate(answer.createdAt)} · {answer.sections?.length ?? 0} secoes</small>
                        </button>
                    ))}
                </div>
            ) : (
                <p className="muted-card-text">Os estudos gerados aparecerao aqui.</p>
            )}
        </div>
    );
}

export function NotesCard({ notes, onOpenNote }: NotesCardProps) {
    return (
        <div id="notes-card" className="library-card compact-list-card">
            <div className="card-title-icon">
                <NotebookPen className="h-5 w-5" />
                <h2>Caderno</h2>
            </div>
            {notes.length > 0 ? (
                <div className="compact-list">
                    {notes.map((note) => (
                        <button key={note.id} type="button" onClick={() => onOpenNote(note)}>
                            <span>{note.reference}</span>
                            <small>{note.body}</small>
                        </button>
                    ))}
                </div>
            ) : (
                <p className="muted-card-text">Suas notas salvas aparecerao aqui.</p>
            )}
        </div>
    );
}

export function FavoritesCard({ favorites, onOpenFavorite }: FavoritesCardProps) {
    return (
        <div id="favorites-card" className="library-card compact-list-card">
            <div className="card-title-icon">
                <Star className="h-5 w-5" />
                <h2>Favoritos</h2>
            </div>
            {favorites.length > 0 ? (
                <div className="compact-list">
                    {favorites.map((favorite) => (
                        <button key={favorite.id} type="button" onClick={() => onOpenFavorite(favorite)}>
                            <span>{favorite.reference}</span>
                            <small>{favorite.text}</small>
                        </button>
                    ))}
                </div>
            ) : (
                <p className="muted-card-text">Seus versiculos favoritos aparecerao aqui.</p>
            )}
        </div>
    );
}

export function ReadingPlanCard({ plan, onCompleteDay }: ReadingPlanCardProps) {
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    async function completeCurrentDay() {
        if (!plan?.currentDay?.id) {
            return;
        }

        setLoading(true);
        setStatus('');

        try {
            await onCompleteDay(plan.currentDay.id);
            setStatus('Leitura concluida');
        } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Nao foi possivel concluir a leitura.');
        } finally {
            setLoading(false);
        }
    }

    if (!plan) {
        return (
            <div id="reading-plan-card" className="library-card reading-plan-card">
                <div className="card-title-icon">
                    <CalendarDays className="h-5 w-5" />
                    <h2>Plano de Leitura</h2>
                </div>
                <p>Importe uma Biblia para montar o plano do Novo Testamento.</p>
            </div>
        );
    }

    return (
        <div id="reading-plan-card" className="library-card reading-plan-card">
            <div className="card-title-icon">
                <CalendarDays className="h-5 w-5" />
                <h2>Plano de Leitura</h2>
            </div>
            <p>{plan.name}</p>
            <div className="progress-track">
                <span style={{ width: `${plan.progressPercent ?? 0}%` }} />
            </div>
            <small>
                Dia {plan.currentDay?.dayNumber ?? plan.completedDays} de {plan.daysCount}
            </small>
            {plan.currentDay && (
                <p className="mt-2 rounded-md bg-[#f9fafb] px-3 py-2 text-sm font-medium text-[#374151]">
                    <BookOpen className="mr-1 inline h-4 w-4" />
                    Hoje: {plan.currentDay.reference}
                </p>
            )}
            <button type="button" onClick={completeCurrentDay} disabled={loading || !plan.currentDay}>
                {loading ? 'Concluindo...' : 'Marcar leitura de hoje'}
            </button>
            {status && <p className="muted-card-text">{status}</p>}
        </div>
    );
}
