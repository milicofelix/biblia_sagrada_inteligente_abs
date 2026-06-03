import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { AuthField, AuthShell } from '../../Components/Auth/AuthShell';
import type { AuthDailyPsalm } from '../../Components/Auth/AuthShell';

type LoginProps = {
    dailyPsalm: AuthDailyPsalm;
};

export default function Login({ dailyPsalm }: LoginProps) {
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/login');
    }

    return (
        <>
            <Head title="Entrar" />
            <AuthShell
                title="Bem-vindo de volta"
                subtitle="Entre para continuar seus estudos, notas e planos de leitura."
                dailyPsalm={dailyPsalm}
            >
                <form onSubmit={submit} className="auth-form">
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
                        autoComplete="current-password"
                    />

                    <label className="auth-check">
                        <input
                            type="checkbox"
                            checked={form.data.remember}
                            onChange={(event) => form.setData('remember', event.target.checked)}
                        />
                        <span>Manter conectado</span>
                    </label>

                    <button type="submit" disabled={form.processing}>
                        {form.processing ? 'Entrando...' : 'Entrar'}
                    </button>

                    <p className="auth-switch">
                        Ainda nao possui uma conta? <Link href="/cadastro">Criar conta</Link>
                    </p>
                </form>
            </AuthShell>
        </>
    );
}
