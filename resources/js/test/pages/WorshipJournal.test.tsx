import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import WorshipJournal from '../../Pages/WorshipJournal';

const { post, setData } = vi.hoisted(() => ({
    post: vi.fn(),
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
            worship_date: '2026-06-14',
            passage_reference: '',
            title: '',
            church_name: '',
            preacher_name: '',
            personal_notes: '',
        },
        errors: {},
        processing: false,
        setData,
        post,
        reset: vi.fn(),
    }),
}));

describe('WorshipJournal', () => {
    it('exibe formulario, historico de cultos e permite registrar um culto', async () => {
        const user = userEvent.setup();

        render(
            <WorshipJournal
                stats={{ verses: 31098 }}
                settings={{ theme: 'light' }}
                entries={[
                    {
                        id: 1,
                        worshipDate: '2026-06-14',
                        formattedDate: '14/06/2026',
                        passageReference: 'Salmos 44:26',
                        title: 'Socorro de Deus',
                        status: 'completed',
                        aiStudy: 'Resumo do culto gerado pela IA.',
                        passage: [{ reference: 'Salmos 44:26', text: 'Levanta-te em nosso auxilio.', translation: 'JFA' }],
                    },
                ]}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Diario de Cultos' })).toBeInTheDocument();
        expect(screen.getByText('Socorro de Deus')).toBeInTheDocument();
        expect(screen.getByText('Resumo do culto gerado pela IA.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Registrar culto' }));

        expect(post).toHaveBeenCalledWith('/diario-cultos', expect.objectContaining({ preserveScroll: true }));
    });
});
