import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface Profile {
    id: string;
    email: string | null;
    nome: string | null;
    autorizacao: boolean;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string, userEmail?: string): Promise<Profile> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !data) {
                console.error('Erro ao buscar perfil:', error);
                // Retorna um profile padrão não autorizado em caso de erro
                return {
                    id: userId,
                    email: userEmail || null,
                    nome: null,
                    autorizacao: false,
                    created_at: new Date().toISOString()
                };
            }
            return data as Profile;
        } catch (err) {
            console.error('Erro ao buscar perfil:', err);
            return {
                id: userId,
                email: userEmail || null,
                nome: null,
                autorizacao: false,
                created_at: new Date().toISOString()
            };
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!isMounted) return;

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    const profileData = await fetchProfile(session.user.id, session.user.email);
                    if (isMounted) setProfile(profileData);
                }
            } catch (error) {
                console.error('Erro na inicialização:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        // Timeout de segurança - garante que loading termine em 5 segundos
        const timeout = setTimeout(() => {
            if (isMounted) {
                console.warn('Auth timeout - forçando fim do loading');
                setLoading(false);
            }
        }, 5000);

        initAuth().finally(() => {
            clearTimeout(timeout);
        });

        // Escutar mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted) return;

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                const profileData = await fetchProfile(session.user.id, session.user.email);
                if (isMounted) setProfile(profileData);
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error as Error | null };
    };

    const signUp = async (email: string, password: string, nome: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nome }
            }
        });

        if (!error && data.user) {
            // Atualizar nome no profile
            await supabase.from('profiles').update({ nome }).eq('id', data.user.id);
        }

        return { error: error as Error | null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
