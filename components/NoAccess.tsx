import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldX, LogOut } from 'lucide-react';

const APP_LOGO_URL = 'https://ybvkcunddrrqyjffwray.supabase.co/storage/v1/object/public/imagens/Logotipo%20Design%20(1).png';

export const NoAccess: React.FC = () => {
    const { signOut, profile } = useAuth();

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl">
                    {/* Logo */}
                    <img src={APP_LOGO_URL} alt="LeadMap" className="w-16 h-16 mx-auto mb-6 opacity-50" />

                    {/* Icon */}
                    <div className="bg-orange-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldX className="w-10 h-10 text-orange-500" />
                    </div>

                    <h2 className="text-2xl font-black text-white mb-3">Sem Acesso</h2>

                    <p className="text-slate-400 mb-2">
                        Sua conta ainda não foi autorizada.
                    </p>
                    <p className="text-slate-500 text-sm mb-8">
                        Entre em contato com o administrador para liberar seu acesso ao sistema.
                    </p>

                    {profile?.email && (
                        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-sm text-slate-400">
                            Logado como: <span className="text-white font-medium">{profile.email}</span>
                        </div>
                    )}

                    <button
                        onClick={signOut}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 mx-auto transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </div>
            </div>
        </div>
    );
};
