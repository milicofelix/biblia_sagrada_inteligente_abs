import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';

import { TopBar } from '../TopBar';

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
});
