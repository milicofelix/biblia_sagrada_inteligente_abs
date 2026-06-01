import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { HistoryCard, NotesCard } from '../LibraryCards';

describe('LibraryCards', () => {
    it('lista estudos recentes e permite reabrir uma resposta dos agentes', async () => {
        const user = userEvent.setup();
        const onOpenAnswer = vi.fn();
        const answer = {
            id: 8,
            question: 'Como estudar perseveranca?',
            createdAt: '2026-06-01T12:00:00.000Z',
            sections: [{ agent: 'study', text: 'Resumo' }],
        };

        render(<HistoryCard answers={[answer]} onOpenAnswer={onOpenAnswer} />);

        await user.click(screen.getByRole('button', { name: /Como estudar perseveranca/i }));

        expect(screen.getByText('Historico')).toBeInTheDocument();
        expect(onOpenAnswer).toHaveBeenCalledWith(answer);
    });

    it('lista notas salvas e permite voltar para o versiculo anotado', async () => {
        const user = userEvent.setup();
        const onOpenNote = vi.fn();
        const note = {
            id: 3,
            reference: 'Joao 3:16',
            body: 'Deus toma a iniciativa do amor.',
            createdAt: '2026-06-01T12:00:00.000Z',
        };

        render(<NotesCard notes={[note]} onOpenNote={onOpenNote} />);

        await user.click(screen.getByRole('button', { name: /Joao 3:16/i }));

        expect(screen.getByText('Caderno')).toBeInTheDocument();
        expect(screen.getByText('Deus toma a iniciativa do amor.')).toBeInTheDocument();
        expect(onOpenNote).toHaveBeenCalledWith(note);
    });
});
