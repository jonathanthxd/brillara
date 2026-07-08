const ADMIN_PASSWORD = "Brillara2026!";
const ADMIN_SESSION_KEY = "brillara_admin_session";

export function loginAdmin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_SESSION_KEY, "true");
    return true;
  }
  return false;
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function logoutAdmin(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
