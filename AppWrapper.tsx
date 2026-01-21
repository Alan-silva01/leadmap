import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';
import { NoAccess } from './components/NoAccess';
import { Loader2 } from 'lucide-react';
import App from './App';

type AuthView = 'login' | 'signup';

export const AppWrapper: React.FC = () => {
    const { user, profile, loading } = useAuth();
    const [authView, setAuthView] = useState<AuthView>('login');

    // Loading
    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-white font-black tracking-widest text-xs uppercase opacity-40">Carregando...</p>
            </div>
        );
    }

    // Não logado - mostrar login ou cadastro
    if (!user) {
        if (authView === 'signup') {
            return <SignUp onSwitchToLogin={() => setAuthView('login')} />;
        }
        return <Login onSwitchToSignUp={() => setAuthView('signup')} />;
    }

    // Logado mas não autorizado
    if (!profile?.autorizacao) {
        return <NoAccess />;
    }

    // Logado e autorizado - mostrar app
    return <App />;
};
