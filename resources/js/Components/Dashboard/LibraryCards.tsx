import { Clock3, NotebookPen } from 'lucide-react';

import type { AiAnswer, StudyNote } from '../../types/dashboard';
import { formatDate } from '../../utils/date';

type HistoryCardProps = {
    answers: AiAnswer[];
    onOpenAnswer: (answer: AiAnswer) => void;
};

type NotesCardProps = {
    notes: StudyNote[];
    onOpenNote: (note: StudyNote) => void;
};

export function HistoryCard({ answers, onOpenAnswer }: HistoryCardProps) {
    return (
        <div className="library-card compact-list-card">
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
        <div className="library-card compact-list-card">
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
