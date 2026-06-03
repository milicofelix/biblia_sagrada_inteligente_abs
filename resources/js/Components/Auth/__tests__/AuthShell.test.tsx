import { render, screen } from '@testing-library/react';

import { AuthShell } from '../AuthShell';

describe('AuthShell', () => {
    it('apresenta a identidade da Biblia Inteligente e o conteudo da autenticacao', () => {
        render(
            <AuthShell title="Bem-vindo de volta" subtitle="Entre para continuar seus estudos.">
                <button type="button">Entrar</button>
            </AuthShell>,
        );

        expect(screen.getByText('BIBLIA')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    });
});
