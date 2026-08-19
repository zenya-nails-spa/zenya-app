export const AUTH_TOKEN_KEY = 'zenya-auth-token';
export const AUTH_ROLE_KEY = 'zenya-auth-role';

export function getRole() {
  return localStorage.getItem(AUTH_ROLE_KEY) || 'admin';
}

export function isAdmin() {
  return getRole() === 'admin';
}
