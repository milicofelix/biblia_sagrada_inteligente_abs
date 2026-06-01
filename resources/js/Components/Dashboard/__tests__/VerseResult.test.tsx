import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { VerseResult } from '../VerseResult';

const verse = {
    id: 16,
    reference: 'Joao 3:16',
    text: 'Porque Deus amou o mundo de tal maneira...',
    translation: 'JFA',
};

describe('VerseResult', () => {
    it('salva uma nota de estudo para o versiculo exibido', async () => {
        const user = userEvent.setup();
        const onSaveNote = vi.fn().mockResolvedValue({
            id: 1,
            reference: 'Joao 3:16',
            body: 'Deus toma a iniciativa do amor.',
        });
        const onToggleFavorite = vi.fn().mockResolvedValue(true);
        const onOpenReference = vi.fn();

        render(<VerseResult result={verse} onSaveNote={onSaveNote} onToggleFavorite={onToggleFavorite} onOpenReference={onOpenReference} />);

        await user.type(screen.getByPlaceholderText('Escreva uma observacao, aplicacao ou pergunta sobre este versiculo.'), 'Deus toma a iniciativa do amor.');
        await user.click(screen.getByRole('button', { name: /Salvar nota/i }));

        expect(onSaveNote).toHaveBeenCalledWith(16, 'Deus toma a iniciativa do amor.');
        expect(await screen.findByText('Nota salva')).toBeInTheDocument();
    });

    it('orienta o usuario quando tenta salvar uma nota vazia', async () => {
        const user = userEvent.setup();
        const onSaveNote = vi.fn();
        const onToggleFavorite = vi.fn().mockResolvedValue(true);
        const onOpenReference = vi.fn();

        render(<VerseResult result={verse} onSaveNote={onSaveNote} onToggleFavorite={onToggleFavorite} onOpenReference={onOpenReference} />);

        await user.click(screen.getByRole('button', { name: /Salvar nota/i }));

        expect(screen.getByText('Digite uma nota antes de salvar.')).toBeInTheDocument();
        expect(onSaveNote).not.toHaveBeenCalled();
    });

    it('alterna o estado de favorito do versiculo', async () => {
        const user = userEvent.setup();
        const onSaveNote = vi.fn().mockResolvedValue({
            id: 1,
            reference: 'Joao 3:16',
            body: 'Deus toma a iniciativa do amor.',
        });
        const onToggleFavorite = vi.fn().mockResolvedValue(true);
        const onOpenReference = vi.fn();

        render(<VerseResult result={verse} onSaveNote={onSaveNote} onToggleFavorite={onToggleFavorite} onOpenReference={onOpenReference} />);

        await user.click(screen.getByRole('button', { name: /Favoritar/i }));

        expect(onToggleFavorite).toHaveBeenCalledWith(16);
        expect(await screen.findByText('Adicionado aos favoritos')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Favorito/i })).toBeInTheDocument();
    });

    it('exibe referencias relacionadas e permite abrir a passagem conectada', async () => {
        const user = userEvent.setup();
        const onSaveNote = vi.fn().mockResolvedValue({
            id: 1,
            reference: 'Joao 3:16',
            body: 'Deus toma a iniciativa do amor.',
        });
        const onToggleFavorite = vi.fn().mockResolvedValue(true);
        const onOpenReference = vi.fn();

        render(
            <VerseResult
                result={{
                    ...verse,
                    crossReferences: [{
                        id: 1,
                        verseId: 58,
                        reference: 'Romanos 5:8',
                        text: 'Mas Deus prova o seu amor para conosco.',
                        relationship: 'amor de Deus',
                    }],
                }}
                onSaveNote={onSaveNote}
                onToggleFavorite={onToggleFavorite}
                onOpenReference={onOpenReference}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Romanos 5:8/i }));

        expect(screen.getByText('Referencias relacionadas')).toBeInTheDocument();
        expect(onOpenReference).toHaveBeenCalledWith('Romanos 5:8');
    });
});
