import { render, screen } from '@testing-library/react';

import { ChronologyContext } from '../ChronologyContext';

const timeline = {
    book: 'Joao',
    testament: 'Novo Testamento',
    chapter: 3,
    verse: 16,
    phase: {
        key: 'gospels',
        title: 'Jesus, Reino e Evangelho',
        period: 'Vida, ministerio, morte e ressurreicao de Jesus',
        summary: 'Os Evangelhos apresentam Jesus como cumprimento das promessas.',
        position: 5,
        total: 7,
    },
    previousPhase: {
        title: 'Profetas, Exilio e Esperanca',
        period: 'Advertencia, juizo, exilio, retorno e promessa messianica',
    },
    nextPhase: {
        title: 'Igreja Primitiva e Epistolas',
        period: 'Expansao da igreja, doutrina e vida comunitaria',
    },
};

describe('ChronologyContext', () => {
    it('mostra a fase cronologica da passagem atual', () => {
        render(<ChronologyContext timeline={timeline} reference="Joao 3:16" />);

        expect(screen.getByText('Cronologia biblica')).toBeInTheDocument();
        expect(screen.getByText('Jesus, Reino e Evangelho')).toBeInTheDocument();
        expect(screen.getByText('Joao 3:16 · Novo Testamento')).toBeInTheDocument();
        expect(screen.getByText('Fase 5 de 7')).toBeInTheDocument();
        expect(screen.getByText('Joao 3:16 dentro de Jesus, Reino e Evangelho.')).toBeInTheDocument();
    });

    it('orienta o usuario quando nao ha passagem importada', () => {
        render(<ChronologyContext timeline={null} reference="Joao 3:16" />);

        expect(screen.getByText('Busque uma passagem importada para posiciona-la na grande narrativa biblica.')).toBeInTheDocument();
    });
});
