import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import * as Linking from 'expo-linking';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
).trim();

const hasRealValue = (value) =>
  Boolean(value) && !value.includes('your-project') && !value.includes('YOUR_');

export const isSupabaseConfigured =
  hasRealValue(supabaseUrl) && hasRealValue(supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: globalThis.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  : null;

export function getAuthRedirectUrl() {
  return (
    (process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL || '').trim() ||
    Linking.createURL('auth/callback')
  );
}

export const supabaseProjectUrl = supabaseUrl;
