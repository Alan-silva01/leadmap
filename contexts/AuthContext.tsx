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

    useEffect(() => {
        let isMounted = true;

        // Escutar mudanças de auth - incluindo INITIAL_SESSION
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            if (!isMounted) return;

            if (session?.user) {
                setSession(session);
                setUser(session.user);

                // Buscar profile de forma síncrona sem await extra
                console.log('Fetching profile for user:', session.user.id);

                // Usar setTimeout para evitar race condition
                setTimeout(async () => {
                    if (!isMounted) return;

                    try {
                        const { data, error } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();

                        console.log('Profile fetch result:', { data, error });

                        if (isMounted) {
                            setProfile(data as Profile || null);
                            setLoading(false);
                        }
                    } catch (err) {
                        console.error('Erro ao buscar perfil:', err);
                        if (isMounted) {
                            setProfile(null);
                            setLoading(false);
                        }
                    }
                }, 0);
            } else {
                setSession(null);
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        // Timeout de segurança
        const timeout = setTimeout(() => {
            if (isMounted && loading) {
                console.warn('Auth timeout - forçando fim do loading');
                setLoading(false);
            }
        }, 8000);

        return () => {
            isMounted = false;
            clearTimeout(timeout);
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
            await supabase.from('profiles').update({ nome }).eq('id', data.user.id);
        }

        return { error: error as Error | null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
