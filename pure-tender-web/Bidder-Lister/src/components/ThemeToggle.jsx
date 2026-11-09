import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light mode' : 'Dark mode'}
      aria-pressed={dark}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#285970] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
