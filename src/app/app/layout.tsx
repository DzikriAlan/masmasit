import { cookies } from 'next/headers';

import { ShellHintProvider } from '@/components/shell-hint';

// The browser Supabase client keeps its session in this cookie (chunked as
// .0, .1, … when large). Its presence is only a hint for the first paint;
// the auth provider still decides once it has verified the session.
const SESSION_COOKIE = /^sb-.+-auth-token(\.\d+)?$/;
const COLLAPSED_COOKIE = 'mm:sidebar-collapsed';

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const jar = cookies();
  const signedIn = jar.getAll().some((c) => SESSION_COOKIE.test(c.name) && c.value !== '');
  const collapsed = jar.get(COLLAPSED_COOKIE)?.value;

  return (
    <ShellHintProvider value={{ signedIn, sidebarCollapsed: collapsed === undefined ? null : collapsed === '1' }}>
      {children}
    </ShellHintProvider>
  );
}
