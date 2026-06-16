import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { DashboardSidebar } from '../Sidebar';

describe('DashboardSidebar', () => {
    it('exibe a identidade do produto e o menu principal da Biblia', () => {
        render(<DashboardSidebar stats={{ verses: 31098 }} />);

        expect(screen.getByText('BIBLIA')).toBeInTheDocument();
        expect(screen.getByText('INTELIGENTE')).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Biblia/i })).toHaveClass('active');
        expect(screen.getByText('31098 versiculos indexados')).toBeInTheDocument();
    });

    it('dispara a navegacao lateral para areas ja existentes', async () => {
        const user = userEvent.setup();
        const onNavigate = vi.fn();

        render(<DashboardSidebar stats={{ verses: 31098 }} activeLabel="Favoritos" onNavigate={onNavigate} />);

        expect(screen.getByRole('button', { name: /Favoritos/i })).toHaveClass('active');

        await user.click(screen.getByRole('button', { name: /Planos de Leitura/i }));

        expect(onNavigate).toHaveBeenCalledWith('Planos de Leitura');
        expect(screen.getByRole('button', { name: /Configuracoes/i })).toBeEnabled();
    });
});
