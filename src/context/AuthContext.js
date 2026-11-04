import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Linking from 'expo-linking';
import {
  getAuthRedirectUrl,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

const AuthContext = createContext(null);

function parseAuthParams(url) {
  if (!url) return new URLSearchParams();

  const [withoutHash, hash = ''] = String(url).split('#');
  const query = withoutHash.split('?')[1] || '';
  const params = new URLSearchParams(query);

  if (hash) {
    const hashParams = new URLSearchParams(hash);
    hashParams.forEach((value, key) => params.set(key, value));
  }

  return params;
}

function humanizeAuthError(message) {
  const text = String(message || '').toLowerCase();

  if (text.includes('invalid login credentials')) {
    return 'The email or password is incorrect.';
  }

  if (text.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }

  if (text.includes('user already registered')) {
    return 'An account already exists for this email. Try signing in instead.';
  }

  if (text.includes('password should be at least')) {
    return 'Use at least 8 characters for your password.';
  }

  if (text.includes('rate limit') || text.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (text.includes('invalid email')) {
    return 'Enter a valid email address.';
  }

  return message || 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [authError, setAuthError] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const profileRequest = useRef(0);

  const redirectTo = useMemo(() => getAuthRedirectUrl(), []);

  const loadProfile = useCallback(async (userId) => {
    if (!supabase) return;

    if (!userId) {
      profileRequest.current += 1;
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    const requestId = profileRequest.current + 1;
    profileRequest.current = requestId;
    setProfileLoading(true);
    setProfileError('');

    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, full_name, display_name, avatar_url, city, state, area')
      .eq('id', userId)
      .maybeSingle();

    if (profileRequest.current !== requestId) return;

    if (error) {
      setProfileError(error.message);
      setProfile(null);
    } else {
      setProfile(data);
    }

    setProfileLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;

    async function bootstrap() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      setSession(data.session);

      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      }

      if (active) setLoading(false);
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      setSession(nextSession);

      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }

      if (nextSession?.user) {
        loadProfile(nextSession.user.id);
      } else {
        profileRequest.current += 1;
        setProfile(null);
        setProfileError('');
        setProfileLoading(false);
      }

      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;

    const handleUrl = async (url) => {
      if (!url || !active) return;

      const params = parseAuthParams(url);
      const errorDescription = params.get('error_description');

      if (errorDescription) {
        setAuthError(errorDescription.replace(/\+/g, ' '));
        return;
      }

      if (params.get('type') === 'recovery') {
        setRecoveryMode(true);
      }

      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && active) setAuthError(humanizeAuthError(error.message));
        return;
      }

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error && active) setAuthError(humanizeAuthError(error.message));
      }
    };

    Linking.getInitialURL()
      .then((url) => {
        if (active) handleUrl(url);
      })
      .catch(() => {});

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) {
      return { ok: false, error: 'The backend is not configured.' };
    }

    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return { ok: false, error: 'Enter your email and password.' };
    }

    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      const message = humanizeAuthError(error.message);
      setAuthError(message);
      return { ok: false, error: message };
    }

    return { ok: true };
  }, []);

  const signUp = useCallback(
    async ({ fullName, email, password }) => {
      if (!supabase) {
        return { ok: false, error: 'The backend is not configured.' };
      }

      const cleanName = String(fullName || '').trim();
      const cleanEmail = String(email || '').trim().toLowerCase();

      if (cleanName.length < 2) {
        return { ok: false, error: 'Enter your full name.' };
      }

      if (!cleanEmail) {
        return { ok: false, error: 'Enter a valid email address.' };
      }

      if (String(password || '').length < 8) {
        return { ok: false, error: 'Use at least 8 characters for your password.' };
      }

      setAuthError('');
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: 'customer',
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        const message = humanizeAuthError(error.message);
        setAuthError(message);
        return { ok: false, error: message };
      }

      return {
        ok: true,
        needsConfirmation: !data.session,
        email: cleanEmail,
      };
    },
    [redirectTo]
  );

  const resendConfirmation = useCallback(
    async (email) => {
      if (!supabase) {
        return { ok: false, error: 'The backend is not configured.' };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: String(email || '').trim().toLowerCase(),
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        return { ok: false, error: humanizeAuthError(error.message) };
      }

      return { ok: true };
    },
    [redirectTo]
  );

  const requestPasswordReset = useCallback(
    async (email) => {
      if (!supabase) {
        return { ok: false, error: 'The backend is not configured.' };
      }

      const cleanEmail = String(email || '').trim().toLowerCase();

      if (!cleanEmail) {
        return { ok: false, error: 'Enter your email address.' };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (error) {
        return { ok: false, error: humanizeAuthError(error.message) };
      }

      return { ok: true };
    },
    [redirectTo]
  );

  const updatePassword = useCallback(async (password) => {
    if (!supabase) {
      return { ok: false, error: 'The backend is not configured.' };
    }

    if (String(password || '').length < 8) {
      return { ok: false, error: 'Use at least 8 characters for your password.' };
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { ok: false, error: humanizeAuthError(error.message) };
    }

    setRecoveryMode(false);
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return { ok: true };

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { ok: false, error: humanizeAuthError(error.message) };
    }

    profileRequest.current += 1;
    setProfile(null);
    setRecoveryMode(false);
    setAuthError('');
    return { ok: true };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await loadProfile(session.user.id);
    }
  }, [loadProfile, session]);

  const value = {
    configured: isSupabaseConfigured,
    session,
    user: session?.user || null,
    profile,
    loading,
    profileLoading,
    profileError,
    authError,
    recoveryMode,
    redirectTo,
    signIn,
    signUp,
    resendConfirmation,
    requestPasswordReset,
    updatePassword,
    signOut,
    refreshProfile,
    clearAuthError: () => setAuthError(''),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}
