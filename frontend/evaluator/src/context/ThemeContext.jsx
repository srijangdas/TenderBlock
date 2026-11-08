import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const THEME_KEY = 'tenderblock_color_theme';

function initialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* Storage may be unavailable. */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => {
    const dark = theme === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* Storage may be unavailable. */ }
  }, [theme]);
  const toggleTheme = () => setTheme(value => value === 'dark' ? 'light' : 'dark');
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
