import type { FormEvent } from 'react';
import { useState } from 'react';

import { NotebookPen, Save } from 'lucide-react';

import type { StudyNote, VerseResultData } from '../../types/dashboard';

type VerseResultProps = {
    result: VerseResultData;
    onSaveNote: (verseId: number, body: string) => Promise<StudyNote>;
};

export function VerseResult({ result, onSaveNote }: VerseResultProps) {
    const [noteBody, setNoteBody] = useState(result.latestNote?.body ?? '');
    const [noteStatus, setNoteStatus] = useState(result.latestNote ? 'Salva' : '');
    const [saving, setSaving] = useState(false);

    async function submitNote(event: FormEvent<HTMLFormElement>) {
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
            setNoteStatus(error instanceof Error ? error.message : 'Nao foi possivel salvar a nota.');
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
                    rows={3}
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
