import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';

import { TopBar } from '../TopBar';

const { post } = vi.hoisted(() => ({
    post: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    router: { post },
}));

describe('TopBar', () => {
    it('permite alterar a busca e submeter a passagem informada', async () => {
        const user = userEvent.setup();
        const onReferenceChange = vi.fn();
        const onSubmit = vi.fn((event) => event.preventDefault());

        function TopBarTestWrapper() {
            const [reference, setReference] = useState('Joao 3:16');

            return (
                <TopBar
                    reference={reference}
                    onReferenceChange={(nextReference) => {
                        setReference(nextReference);
                        onReferenceChange(nextReference);
                    }}
                    onSubmit={onSubmit}
                />
            );
        }

        render(<TopBarTestWrapper />);

        await user.clear(screen.getByPlaceholderText('Buscar por palavra-chave, versiculo ou tema...'));
        await user.type(screen.getByPlaceholderText('Buscar por palavra-chave, versiculo ou tema...'), 'Romanos 5:3');
        await user.click(screen.getByRole('button', { name: 'Buscar' }));

        expect(onReferenceChange).toHaveBeenCalled();
        expect(onReferenceChange).toHaveBeenLastCalledWith('Romanos 5:3');
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('exibe o usuario autenticado e permite sair', async () => {
        const user = userEvent.setup();

        render(
            <TopBar
                reference="Joao 3:16"
                user={{ id: 1, name: 'Adriano Freitas', email: 'adriano@example.com' }}
                onReferenceChange={vi.fn()}
                onSubmit={vi.fn((event) => event.preventDefault())}
            />,
        );

        expect(screen.getByText('Adriano Freitas')).toBeInTheDocument();
        expect(screen.getByText('adriano@example.com')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Sair' }));

        expect(post).toHaveBeenCalledWith('/logout');
    });
});
