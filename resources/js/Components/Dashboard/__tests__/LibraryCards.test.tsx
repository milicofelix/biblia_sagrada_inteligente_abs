import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { FavoritesCard, HistoryCard, NotesCard, ReadingPlanCard } from '../LibraryCards';

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

    it('lista favoritos e permite abrir o versiculo salvo', async () => {
        const user = userEvent.setup();
        const onOpenFavorite = vi.fn();
        const favorite = {
            id: 1,
            verseId: 16,
            reference: 'Joao 3:16',
            text: 'Porque Deus amou o mundo de tal maneira...',
            translation: 'JFA',
            createdAt: '2026-06-01T12:00:00.000Z',
        };

        render(<FavoritesCard favorites={[favorite]} onOpenFavorite={onOpenFavorite} />);

        await user.click(screen.getByRole('button', { name: /Joao 3:16/i }));

        expect(screen.getByText('Favoritos')).toBeInTheDocument();
        expect(screen.getByText('Porque Deus amou o mundo de tal maneira...')).toBeInTheDocument();
        expect(onOpenFavorite).toHaveBeenCalledWith(favorite);
    });

    it('conclui o dia atual do plano de leitura', async () => {
        const user = userEvent.setup();
        const plan = {
            id: 1,
            name: 'Novo Testamento em 90 dias',
            description: 'Leitura progressiva do Novo Testamento.',
            daysCount: 90,
            completedDays: 0,
            progressPercent: 0,
            currentDay: {
                id: 10,
                dayNumber: 1,
                title: 'Dia 1',
                reference: 'Mateus 1-2',
                completedAt: null,
            },
        };
        const onCompleteDay = vi.fn().mockResolvedValue({
            ...plan,
            completedDays: 1,
            progressPercent: 1,
        });

        render(<ReadingPlanCard plan={plan} onCompleteDay={onCompleteDay} />);

        await user.click(screen.getByRole('button', { name: /Marcar leitura de hoje/i }));

        expect(onCompleteDay).toHaveBeenCalledWith(10);
        expect(await screen.findByText('Leitura concluida')).toBeInTheDocument();
    });
});
