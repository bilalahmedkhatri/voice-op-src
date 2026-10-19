'use client';

import type {ComponentProps} from 'react';
import {useLocale} from 'next-intl';
import {localizePath, type Locale} from '@/i18n/routing';
import Button, {type ButtonProps} from '@/components/ui/Button';

export default function SignInLink({returnTo = '/admin', ...props}: Omit<ComponentProps<'a'>, 'href'> & {returnTo?: string}) {
  const locale = useLocale() as Locale;
  return <a {...props} href={`/api/auth/google?returnTo=${encodeURIComponent(localizePath(returnTo, locale))}`} />;
}

export function SignInButton({returnTo = '/admin', ...props}: Omit<ButtonProps, 'href'> & {returnTo?: string}) {
  const locale = useLocale() as Locale;
  return <Button {...props} href={`/api/auth/google?returnTo=${encodeURIComponent(localizePath(returnTo, locale))}`} />;
}
