import { createContext, useCallback, useMemo, useState } from 'react';

export const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const value = useMemo(
    () => ({
      mobileNavOpen,
      setMobileNavOpen,
      openMobileNav,
      closeMobileNav,
      searchOpen,
      setSearchOpen,
      openSearch,
      closeSearch,
    }),
    [mobileNavOpen, searchOpen, openMobileNav, closeMobileNav, openSearch, closeSearch]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}