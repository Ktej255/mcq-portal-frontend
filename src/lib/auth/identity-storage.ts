export const ONBOARDING_CACHE_KEY_PREFIX = "lms-onboarding-completed-";
export const DIAGNOSTIC_STORAGE_KEY = "sarit-diagnostic-plan-v1";

export const ANSWER_DRAFT_STORAGE_PREFIX = "optional-answer-draft-v1:";

const IDENTITY_STORAGE_PROVIDER_KEY = "sarit-auth-provider-v1";
const IDENTITY_STORAGE_USER_KEY = "sarit-auth-identity-v1";

export function onboardingCacheKey(provider: string, userId: string, subject: string) {
  return `${ONBOARDING_CACHE_KEY_PREFIX}${provider}-${encodeURIComponent(userId)}-${subject}`;
}

export const getOnboardingCacheKey = onboardingCacheKey;

export function diagnosticStorageKey(provider: string, userId: string) {
  return `${DIAGNOSTIC_STORAGE_KEY}-${provider}-${encodeURIComponent(userId)}`;
}

export function answerDraftStorageKey(provider: string, userId: string, slug: string, promptKey: string) {
  return `${ANSWER_DRAFT_STORAGE_PREFIX}${provider}:${encodeURIComponent(userId)}:${encodeURIComponent(slug)}:${encodeURIComponent(promptKey)}`;
}

export function clearIdentitySensitiveBrowserState() {
  if (typeof window === "undefined") return;

  try {
    Object.keys(window.sessionStorage).forEach((key) => {
      if (key.startsWith(ONBOARDING_CACHE_KEY_PREFIX) || key.startsWith(ANSWER_DRAFT_STORAGE_PREFIX)) {
        window.sessionStorage.removeItem(key);
      }
    });
  } catch {
    // Continue with localStorage cleanup when sessionStorage is unavailable.
  }

  try {
    Object.keys(window.localStorage).forEach((key) => {
      if (key === DIAGNOSTIC_STORAGE_KEY || key.startsWith(`${DIAGNOSTIC_STORAGE_KEY}-`)) {
        window.localStorage.removeItem(key);
      }
    });
  } catch {
    // Browser storage may be disabled in private browsing.
  }
}

export function reconcileIdentityStorageProvider(provider: string) {
  if (typeof window === "undefined") return;

  try {
    const previousProvider = window.localStorage.getItem(IDENTITY_STORAGE_PROVIDER_KEY);
    if (previousProvider && previousProvider !== provider) {
      clearIdentitySensitiveBrowserState();
    }
    window.localStorage.setItem(IDENTITY_STORAGE_PROVIDER_KEY, provider);
  } catch {
    // Browser storage may be disabled in private browsing.
  }
}

export function reconcileIdentityStorageUser(provider: string, userId: string) {
  if (typeof window === "undefined") return false;

  try {
    const identity = `${provider}:${userId}`;
    const previousIdentity = window.localStorage.getItem(IDENTITY_STORAGE_USER_KEY);
    const changed = Boolean(previousIdentity && previousIdentity !== identity);
    if (changed) {
      clearIdentitySensitiveBrowserState();
    }
    window.localStorage.setItem(IDENTITY_STORAGE_USER_KEY, identity);
    return changed;
  } catch {
    // Browser storage may be disabled in private browsing.
    return false;
  }
}

export function clearIdentityStorageUser() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(IDENTITY_STORAGE_USER_KEY);
  } catch {
    // Browser storage may be disabled in private browsing.
  }
}
