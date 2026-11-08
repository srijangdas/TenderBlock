import { createContext,useContext,useState } from 'react';
import { login as loginRequest } from '../api/authApi';
const AuthContext=createContext(null);const KEY='tb-ops-session';
function readSession(){try{return JSON.parse(sessionStorage.getItem(KEY))}catch{return null}}
export function AuthProvider({children}){const [session,setSession]=useState(readSession);async function login(email,password){const next=await loginRequest(email,password);sessionStorage.setItem(KEY,JSON.stringify(next));setSession(next);return next.user}function logout(){sessionStorage.removeItem(KEY);setSession(null)}return <AuthContext.Provider value={{session,user:session?.user||null,token:session?.token||null,login,logout}}>{children}</AuthContext.Provider>}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be used inside AuthProvider');return value}
