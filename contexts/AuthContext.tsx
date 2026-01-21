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

    const fetchProfile = async (userId: string): Promise<Profile | null> => {
        console.log('Fetching profile for user:', userId);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            console.log('Profile fetch result:', { data, error });

            if (error) {
                console.error('Erro ao buscar perfil:', error);
                return null;
            }
            return data as Profile;
        } catch (err) {
            console.error('Erro ao buscar perfil:', err);
            return null;
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            console.log('Iniciando auth...');
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                console.log('Session result:', { session, error });

                if (!isMounted) return;

                if (session?.user) {
                    setSession(session);
                    setUser(session.user);

                    const profileData = await fetchProfile(session.user.id);
                    console.log('Profile loaded:', profileData);
                    if (isMounted) setProfile(profileData);
                } else {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                }
            } catch (error) {
                console.error('Erro na inicialização:', error);
            } finally {
                if (isMounted) {
                    console.log('Setting loading to false');
                    setLoading(false);
                }
            }
        };

        initAuth();

        // Escutar mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            if (!isMounted) return;

            if (session?.user) {
                setSession(session);
                setUser(session.user);

                const profileData = await fetchProfile(session.user.id);
                if (isMounted) setProfile(profileData);
            } else {
                setSession(null);
                setUser(null);
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
