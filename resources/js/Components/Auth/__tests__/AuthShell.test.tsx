import { render, screen } from '@testing-library/react';

import { AuthShell } from '../AuthShell';

describe('AuthShell', () => {
    it('apresenta a identidade da Biblia Inteligente e o conteudo da autenticacao', () => {
        render(
            <AuthShell
                title="Bem-vindo de volta"
                subtitle="Entre para continuar seus estudos."
                dailyPsalm={{
                    reference: 'Salmos 23:1',
                    text: 'O Senhor e o meu pastor, nada me faltara.',
                    translation: 'JFA',
                }}
            >
                <button type="button">Entrar</button>
            </AuthShell>,
        );

        expect(screen.getByText('BIBLIA')).toBeInTheDocument();
        expect(screen.getByText('"O Senhor e o meu pastor, nada me faltara."')).toBeInTheDocument();
        expect(screen.getByText('Salmos 23:1 · JFA')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    });
});
