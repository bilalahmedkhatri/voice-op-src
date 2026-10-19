import {isLocale, localizePath} from './routing';

export function browserPath(path: string): string {
  const segment = window.location.pathname.split('/')[1];
  return localizePath(path, isLocale(segment) ? segment : 'en');
}

export function browserSignInUrl() {
  return `/api/auth/google?returnTo=${encodeURIComponent(browserPath('/admin'))}`;
}
