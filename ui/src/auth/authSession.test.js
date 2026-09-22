import {
  AUTH_SESSION_STORAGE_KEY,
  clearAuthSession,
  persistAuthSession,
  restoreAuthSession,
} from "./authSession";

function storageWith(value = null) {
  return {
    getItem: jest.fn(() => value),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };
}

const validSession = { authHeader: "Basic bWVzb3M6dGVzdA==", principal: "mesos" };

test("restores a valid authenticated tab session after refresh", () => {
  const storage = storageWith(JSON.stringify(validSession));
  expect(restoreAuthSession(storage)).toEqual(validSession);
  expect(storage.getItem).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
});

test.each([
  null,
  "not-json",
  JSON.stringify({ authHeader: "Bearer token", principal: "mesos" }),
  JSON.stringify({ authHeader: "Basic token", principal: "" }),
  JSON.stringify({ authHeader: 42, principal: "mesos" }),
])("rejects malformed or incomplete stored sessions", (value) => {
  expect(restoreAuthSession(storageWith(value))).toBeNull();
});

test("persists only a validated Basic auth session", () => {
  const storage = storageWith();
  expect(persistAuthSession(validSession, storage)).toBe(true);
  expect(storage.setItem).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY, JSON.stringify(validSession));
  expect(persistAuthSession({ authHeader: "", principal: "mesos" }, storage)).toBe(false);
});

test("logout clears the persisted session", () => {
  const storage = storageWith();
  expect(clearAuthSession(storage)).toBe(true);
  expect(storage.removeItem).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
});

test("blocked sessionStorage safely falls back to an anonymous session", () => {
  const blocked = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
    removeItem: () => { throw new Error("blocked"); },
  };
  expect(restoreAuthSession(blocked)).toBeNull();
  expect(persistAuthSession(validSession, blocked)).toBe(false);
  expect(clearAuthSession(blocked)).toBe(false);
});
