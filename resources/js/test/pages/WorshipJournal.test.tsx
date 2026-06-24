import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import WorshipJournal from '../../Pages/WorshipJournal';

const { post, patch, setData, deleteRoute, clearErrors, reset } = vi.hoisted(() => ({
    post: vi.fn(),
    patch: vi.fn(),
    setData: vi.fn(),
    deleteRoute: vi.fn(),
    clearErrors: vi.fn(),
    reset: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    router: { get: vi.fn(), delete: deleteRoute },
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
        patch,
        reset,
        clearErrors,
    }),
}));

const entries = [
    {
        id: 1,
        worshipDate: '2026-06-14',
        formattedDate: '14/06/2026',
        passageReference: 'Salmos 44:26',
        title: 'Socorro de Deus',
        churchName: 'Igreja Local',
        preacherName: 'Pastor Joao',
        personalNotes: 'Anotacao do culto.',
        status: 'completed',
        aiStudy: 'Resumo do culto gerado pela IA.',
        passage: [{ reference: 'Salmos 44:26', text: 'Levanta-te em nosso auxilio.', translation: 'JFA' }],
    },
];

describe('WorshipJournal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    it('exibe formulario, historico de cultos e permite registrar um culto', async () => {
        const user = userEvent.setup();

        render(<WorshipJournal stats={{ verses: 31098 }} settings={{ theme: 'light' }} entries={entries} />);

        expect(screen.getByRole('heading', { name: 'Diario de Cultos' })).toBeInTheDocument();
        expect(screen.getByText('Socorro de Deus')).toBeInTheDocument();
        expect(screen.getByText('Resumo do culto gerado pela IA.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Registrar culto' }));

        expect(post).toHaveBeenCalledWith('/diario-cultos', expect.objectContaining({ preserveScroll: true }));
    });

    it('carrega um registro no formulario e envia alteracoes', async () => {
        const user = userEvent.setup();

        render(<WorshipJournal stats={{ verses: 31098 }} settings={{ theme: 'light' }} entries={entries} />);

        await user.click(screen.getByRole('button', { name: 'Editar' }));
        await user.click(screen.getByRole('button', { name: 'Salvar alteracoes' }));

        expect(setData).toHaveBeenCalledWith('worship_date', '2026-06-14');
        expect(setData).toHaveBeenCalledWith('passage_reference', 'Salmos 44:26');
        expect(setData).toHaveBeenCalledWith('title', 'Socorro de Deus');
        expect(setData).toHaveBeenCalledWith('church_name', 'Igreja Local');
        expect(setData).toHaveBeenCalledWith('preacher_name', 'Pastor Joao');
        expect(setData).toHaveBeenCalledWith('personal_notes', 'Anotacao do culto.');
        expect(patch).toHaveBeenCalledWith('/diario-cultos/1', expect.objectContaining({ preserveScroll: true }));
    });

    it('pede confirmacao e exclui um registro', async () => {
        const user = userEvent.setup();

        render(<WorshipJournal stats={{ verses: 31098 }} settings={{ theme: 'light' }} entries={entries} />);

        await user.click(screen.getByRole('button', { name: 'Excluir' }));

        expect(window.confirm).toHaveBeenCalledWith('Excluir o registro "Socorro de Deus" do Diario de Cultos?');
        expect(deleteRoute).toHaveBeenCalledWith('/diario-cultos/1', expect.objectContaining({ preserveScroll: true }));
    });
});
