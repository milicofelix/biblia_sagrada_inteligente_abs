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

        render(<VerseResult result={verse} onSaveNote={onSaveNote} />);

        await user.type(screen.getByPlaceholderText('Escreva uma observacao, aplicacao ou pergunta sobre este versiculo.'), 'Deus toma a iniciativa do amor.');
        await user.click(screen.getByRole('button', { name: /Salvar nota/i }));

        expect(onSaveNote).toHaveBeenCalledWith(16, 'Deus toma a iniciativa do amor.');
        expect(await screen.findByText('Nota salva')).toBeInTheDocument();
    });

    it('orienta o usuario quando tenta salvar uma nota vazia', async () => {
        const user = userEvent.setup();
        const onSaveNote = vi.fn();

        render(<VerseResult result={verse} onSaveNote={onSaveNote} />);

        await user.click(screen.getByRole('button', { name: /Salvar nota/i }));

        expect(screen.getByText('Digite uma nota antes de salvar.')).toBeInTheDocument();
        expect(onSaveNote).not.toHaveBeenCalled();
    });
});
