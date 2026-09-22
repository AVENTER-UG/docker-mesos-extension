export const AUTH_SESSION_STORAGE_KEY = "clusterd.authSession";

export function isValidAuthSession(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.authHeader === "string" &&
    value.authHeader.startsWith("Basic ") &&
    value.authHeader.length > "Basic ".length &&
    typeof value.principal === "string" &&
    value.principal.trim().length > 0
  );
}

function browserSessionStorage(storage) {
  return storage ?? (typeof window !== "undefined" ? window.sessionStorage : null);
}

export function restoreAuthSession(storage) {
  try {
    const serialized = browserSessionStorage(storage)?.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!serialized) return null;
    const session = JSON.parse(serialized);
    return isValidAuthSession(session)
      ? { authHeader: session.authHeader, principal: session.principal }
      : null;
  } catch (_) {
    return null;
  }
}

export function persistAuthSession(session, storage) {
  if (!isValidAuthSession(session)) return false;
  try {
    browserSessionStorage(storage)?.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({
      authHeader: session.authHeader,
      principal: session.principal,
    }));
    return true;
  } catch (_) {
    return false;
  }
}

export function clearAuthSession(storage) {
  try {
    browserSessionStorage(storage)?.removeItem(AUTH_SESSION_STORAGE_KEY);
    return true;
  } catch (_) {
    return false;
  }
}
