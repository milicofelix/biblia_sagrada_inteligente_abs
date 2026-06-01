import { render, screen } from '@testing-library/react';

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
});
