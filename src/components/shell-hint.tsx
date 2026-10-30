'use client';

import { createContext, useContext } from 'react';

/**
 * What the server already knows from the request's cookies when it renders
 * an /app page: whether a Supabase session is present, and whether the
 * sidebar was left collapsed. The shell uses it for its first paint, so a
 * refresh lands straight on the sidebar layout at the right width instead
 * of flashing the public navbar while auth loads.
 */
export interface ShellHint {
  signedIn: boolean;
  sidebarCollapsed: boolean | null;
}

const ShellHintContext = createContext<ShellHint>({ signedIn: false, sidebarCollapsed: null });

export function ShellHintProvider({ value, children }: { value: ShellHint; children: React.ReactNode }) {
  return <ShellHintContext.Provider value={value}>{children}</ShellHintContext.Provider>;
}

export const useShellHint = () => useContext(ShellHintContext);
