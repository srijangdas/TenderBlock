import { createContext,useContext,useEffect,useState } from 'react';
const ThemeContext=createContext(null);const KEY='tenderblock_color_theme';
function initialTheme(){try{const saved=localStorage.getItem(KEY);if(saved==='dark'||saved==='light')return saved}catch{}return window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light'}
export function ThemeProvider({children}){const [theme,setTheme]=useState(initialTheme);useEffect(()=>{const dark=theme==='dark';document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light';try{localStorage.setItem(KEY,theme)}catch{}},[theme]);const toggleTheme=()=>setTheme(v=>v==='dark'?'light':'dark');return <ThemeContext.Provider value={{theme,toggleTheme}}>{children}</ThemeContext.Provider>}
export function useTheme(){const value=useContext(ThemeContext);if(!value)throw new Error('useTheme must be used inside ThemeProvider');return value}
