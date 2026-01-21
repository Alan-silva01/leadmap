import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { supabase } from '../services/supabase';

const APP_LOGO_URL = 'https://ybvkcunddrrqyjffwray.supabase.co/storage/v1/object/public/imagens/Logotipo%20Design%20(1).png';

export const NoAccess: React.FC = () => {
    const { signOut, user } = useAuth();

    // Escutar mudanças na autorização via realtime
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('profile-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    // Se autorização mudou para true, recarrega a página
                    if (payload.new && payload.new.autorizacao === true) {
                        window.location.reload();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
            {/* Logo */}
            <img src={APP_LOGO_URL} alt="LeadMap" className="w-24 h-24 mb-8" />

            <h1 className="text-3xl font-black italic tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent mb-4 pb-1">
                LeadMap
            </h1>

            <p className="text-slate-400 text-center mb-8">
                Fale com o administrador do app
            </p>

            <button
                onClick={signOut}
                className="text-slate-500 hover:text-white text-sm flex items-center gap-2 transition-colors"
            >
                <LogOut className="w-4 h-4" />
                Sair
            </button>
        </div>
    );
};
