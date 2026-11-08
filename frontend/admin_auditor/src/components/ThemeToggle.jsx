import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle(){const {theme,toggleTheme}=useTheme();const dark=theme==='dark';return <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={dark?'Switch to light theme':'Switch to dark theme'} title={dark?'Light mode':'Dark mode'} aria-pressed={dark}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button>}
