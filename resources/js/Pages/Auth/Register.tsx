import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { AuthField, AuthShell } from '../../Components/Auth/AuthShell';

export default function Register() {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/cadastro');
    }

    return (
        <>
            <Head title="Criar conta" />
            <AuthShell title="Comece sua jornada" subtitle="Crie uma conta para guardar seus estudos de forma pessoal.">
                <form onSubmit={submit} className="auth-form">
                    <AuthField
                        label="Nome"
                        type="text"
                        value={form.data.name}
                        onChange={(value) => form.setData('name', value)}
                        error={form.errors.name}
                        autoComplete="name"
                    />
                    <AuthField
                        label="E-mail"
                        type="email"
                        value={form.data.email}
                        onChange={(value) => form.setData('email', value)}
                        error={form.errors.email}
                        autoComplete="email"
                    />
                    <AuthField
                        label="Senha"
                        type="password"
                        value={form.data.password}
                        onChange={(value) => form.setData('password', value)}
                        error={form.errors.password}
                        autoComplete="new-password"
                    />
                    <AuthField
                        label="Confirmar senha"
                        type="password"
                        value={form.data.password_confirmation}
                        onChange={(value) => form.setData('password_confirmation', value)}
                        error={form.errors.password_confirmation}
                        autoComplete="new-password"
                    />

                    <button type="submit" disabled={form.processing}>
                        {form.processing ? 'Criando conta...' : 'Criar conta'}
                    </button>

                    <p className="auth-switch">
                        Ja possui uma conta? <Link href="/login">Entrar</Link>
                    </p>
                </form>
            </AuthShell>
        </>
    );
}
