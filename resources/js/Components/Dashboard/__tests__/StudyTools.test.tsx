import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { StudyTools } from '../StudyTools';

const studyText = `
## Resumo
Joao 3:16 apresenta o amor de Deus como origem da salvacao.

## Pontos principais
- Deus ama o mundo.
- O Filho foi dado por iniciativa divina.

## Flashcards
- Qual e a origem da salvacao?: O amor de Deus.
- O que significa crer?: Confiar no Filho enviado por Deus.

## Quiz
- O que Joao 3:16 revela sobre o amor de Deus?
- Qual resposta humana aparece no texto?

## Plano curto
- Releia Joao 3:16 em voz alta.
`;

describe('StudyTools', () => {
    it('organiza o estudo em resumo, pontos principais e plano curto', () => {
        render(<StudyTools text={studyText} />);

        expect(screen.getByText('Ferramentas de estudo')).toBeInTheDocument();
        expect(screen.getByText('Joao 3:16 apresenta o amor de Deus como origem da salvacao.')).toBeInTheDocument();
        expect(screen.getByText('Deus ama o mundo.')).toBeInTheDocument();
        expect(screen.getByText('Releia Joao 3:16 em voz alta.')).toBeInTheDocument();
    });

    it('permite virar flashcards para revisar respostas', async () => {
        const user = userEvent.setup();

        render(<StudyTools text={studyText} />);

        await user.click(screen.getByRole('button', { name: /Flashcards/i }));
        await user.click(screen.getByRole('button', { name: /Qual e a origem da salvacao/i }));

        expect(screen.getByText('O amor de Deus.')).toBeInTheDocument();
    });

    it('permite marcar perguntas do quiz como revisadas', async () => {
        const user = userEvent.setup();

        render(<StudyTools text={studyText} />);

        await user.click(screen.getByRole('button', { name: /Quiz/i }));
        await user.click(screen.getAllByRole('button', { name: /Marcar revisada/i })[0]);

        expect(screen.getByRole('button', { name: 'Revisada' })).toBeInTheDocument();
    });

    it('entende flashcards antigos com pergunta e resposta em linhas separadas', async () => {
        const user = userEvent.setup();
        const oldFormat = `
## Flashcards
Q: O que Deus revelou em Joao 3:16?
A: Que seu amor alcança o mundo por meio do Filho.
`;

        render(<StudyTools text={oldFormat} />);

        await user.click(screen.getByRole('button', { name: /Flashcards/i }));
        await user.click(screen.getByRole('button', { name: /O que Deus revelou/i }));

        expect(screen.getByText('Que seu amor alcança o mundo por meio do Filho.')).toBeInTheDocument();
    });
});
