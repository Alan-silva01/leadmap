import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Mail, Lock, User, UserPlus, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

const APP_LOGO_URL = 'https://ybvkcunddrrqyjffwray.supabase.co/storage/v1/object/public/imagens/Logotipo%20Design%20(1).png';

interface SignUpProps {
    onSwitchToLogin: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSwitchToLogin }) => {
    const { signUp } = useAuth();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            setLoading(false);
            return;
        }

        const { error } = await signUp(email, password, nome);

        if (error) {
            if (error.message.includes('already registered')) {
                setError('Este e-mail já está cadastrado');
            } else {
                setError('Erro ao criar conta. Tente novamente.');
            }
        } else {
            setSuccess(true);
        }

        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="w-full max-w-md text-center">
                    <div className="bg-green-500/10 backdrop-blur-xl rounded-3xl p-10 border border-green-500/20">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-white mb-3">Conta criada!</h2>
                        <p className="text-slate-400 mb-8">
                            Sua conta foi criada com sucesso. Aguarde a liberação de acesso pelo administrador.
                        </p>
                        <button
                            onClick={onSwitchToLogin}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-8 rounded-xl transition-all"
                        >
                            FAZER LOGIN
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <img src={APP_LOGO_URL} alt="LeadMap" className="w-20 h-20 mb-4" />
                    <h1 className="text-3xl font-black italic tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent pb-1">
                        LeadMap
                    </h1>
                    <p className="text-slate-500 text-sm mt-2">Crie sua conta</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="text"
                                    required
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Seu nome"
                                    className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                CRIAR CONTA
                            </>
                        )}
                    </button>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="text-slate-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
