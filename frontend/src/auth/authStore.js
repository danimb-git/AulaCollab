export function setToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

/**
 * Opcional: si el backend et retorna user al login, el pots guardar
 * així tens role a mà. Si no, no passa res.
 */
export function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}
