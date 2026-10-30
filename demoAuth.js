// Public demo only. This is a visual preview gate, NOT a security boundary.
export function demoCredentialsMatch(login, password) {
  return ['admin','админ','дамин'].includes(String(login).trim().toLowerCase()) && ['admin','админ'].includes(password);
}

export function requiresDemoLogin(tab) {
  return tab !== 'home' && tab !== 'login';
}
