export const env = {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  NEXT_PUBLIC_USE_MOCK_AUTH:
    process.env.NEXT_PUBLIC_USE_MOCK_AUTH ??
    (!process.env.NEXT_PUBLIC_AUTH_PROVIDER && process.env.NODE_ENV === 'development' ? 'true' : undefined),
  NEXT_PUBLIC_AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER,
  NEXT_PUBLIC_DEBUG_API: process.env.NEXT_PUBLIC_DEBUG_API,
  NEXT_PUBLIC_ENABLE_LEGACY_API: process.env.NEXT_PUBLIC_ENABLE_LEGACY_API,
  NEXT_PUBLIC_STUDENT_PREVIEW_LOGIN: process.env.NEXT_PUBLIC_STUDENT_PREVIEW_LOGIN,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_MEDIA_APPROVED: process.env.NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_MEDIA_APPROVED,
  NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_MEDIA_URL: process.env.NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_MEDIA_URL,
  NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_MEDIA_LABEL: process.env.NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_MEDIA_LABEL,
  NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_TRANSCRIPT_URL: process.env.NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_TRANSCRIPT_URL,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isMockAuth = env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

export type AuthProviderName = 'mock' | 'firebase' | 'supabase' | 'clerk';

export const activeAuthProvider: AuthProviderName = isMockAuth
  ? 'mock'
  : env.NEXT_PUBLIC_AUTH_PROVIDER === 'clerk'
    ? 'clerk'
    : env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase'
      ? 'supabase'
      : 'firebase';

const hasValidClerkPublishableKey =
  typeof env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'string' &&
  /^pk_(test|live)_[A-Za-z0-9_-]{20,}$/.test(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export const missingClerkEnvVars = [
  [
    hasValidClerkPublishableKey
      ? 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'
      : 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY(valid pk_test_/pk_live_ value)',
    hasValidClerkPublishableKey ? env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY : undefined,
  ],
]
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const clerkConfigReady = activeAuthProvider !== 'clerk' || missingClerkEnvVars.length === 0;

export const missingSupabaseEnvVars = [
  ['NEXT_PUBLIC_SUPABASE_URL', env.NEXT_PUBLIC_SUPABASE_URL],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
]
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const supabaseConfigReady = activeAuthProvider !== 'supabase' || missingSupabaseEnvVars.length === 0;

export const missingFirebaseEnvVars = [
  ['NEXT_PUBLIC_FIREBASE_API_KEY', env.NEXT_PUBLIC_FIREBASE_API_KEY],
  ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN],
  ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', env.NEXT_PUBLIC_FIREBASE_PROJECT_ID],
  ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET],
  ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID],
  ['NEXT_PUBLIC_FIREBASE_APP_ID', env.NEXT_PUBLIC_FIREBASE_APP_ID],
]
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigReady = isMockAuth || missingFirebaseEnvVars.length === 0;

export const legacyApiEnabled = env.NEXT_PUBLIC_ENABLE_LEGACY_API === 'true';
