import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import Settings from '../../Pages/Settings';

const { patch, setData } = vi.hoisted(() => ({
    patch: vi.fn(),
    setData: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    router: { get: vi.fn() },
    usePage: () => ({
        props: {
            auth: { user: { id: 1, name: 'Adriano', email: 'adriano@example.com' } },
            flash: {},
        },
    }),
    useForm: () => ({
        data: {
            translation_id: 1,
            initial_reference: 'Joao 3:16',
            theme: 'light',
            notifications_enabled: true,
        },
        errors: {},
        processing: false,
        setData,
        patch,
    }),
}));

describe('Settings', () => {
    it('exibe preferencias reais e permite salvar', async () => {
        const user = userEvent.setup();

        render(
            <Settings
                stats={{ verses: 31098 }}
                settings={{
                    translationId: 1,
                    initialReference: 'Joao 3:16',
                    theme: 'light',
                    notificationsEnabled: true,
                }}
                translations={[
                    { id: 1, name: 'Joao Ferreira de Almeida', abbreviation: 'JFA' },
                ]}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Configuracoes' })).toBeInTheDocument();
        expect(screen.getByDisplayValue('Joao 3:16')).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Joao Ferreira de Almeida (JFA)' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Noturno' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Salvar configuracoes' }));

        expect(patch).toHaveBeenCalledWith('/configuracoes', { preserveScroll: true });
    });
});
